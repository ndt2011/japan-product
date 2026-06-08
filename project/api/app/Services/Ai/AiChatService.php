<?php

namespace App\Services\Ai;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\ExchangeRate;
use App\Models\Invoice;
use App\Models\Order;
use App\Services\ProductEmbeddingService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI Chat nhân viên service
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 4-7
 */
class AiChatService
{
    public function __construct(
        private readonly IntentClassifier $classifier,
        private readonly SearchQueryNormalizer $queryNormalizer,
        private readonly ProductEmbeddingService $embeddingService,
        private readonly AiWebProductSearchService $webSearchService,
        private readonly RakutenKeywordTranslatorService $keywordTranslator,
        private readonly AiSessionMemoryService $sessionMemory,
        private readonly AiOrderHistoryInsightService $orderInsights,
        private readonly AiTeachingCatalogService $teachingCatalog,
    ) {}

    /**
     * Xử lý 1 tin nhắn từ user và trả về reply của AI.
     *
     * @param  Authenticatable  $user
     * @param  string  $userType  (admin / company / branch_manager / branch_staff)
     * @param  string  $message
     * @param  int|null  $conversationId
     * @return array{conversation_id: int, message_id: int, reply: string, intent: string, data: array, suggestions: string[], memory: array}
     */
    public function chat(
        Authenticatable $user,
        string $userType,
        string $message,
        ?int $conversationId = null,
    ): array {
        $branchId = $this->resolveBranchId($user, $userType);

        // 1. Lấy hoặc tạo conversation
        $conversation = $conversationId
            ? AiConversation::findOrFail($conversationId)
            : AiConversation::create([
                'user_type' => $userType,
                'user_id'   => $user->id,
                'branch_id' => $branchId,
                'title'     => mb_substr($message, 0, 50),
            ]);

        $sessionContext = (array) ($conversation->session_context ?? []);
        $effectiveMessage = $this->sessionMemory->resolveMessageWithContext($message, $sessionContext);

        // 2. Lưu tin nhắn user
        AiMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'user',
            'content'         => $message,
        ]);

        // 3. Phân loại intent (dùng câu đã bổ sung ngữ cảnh phiên)
        $intent = $this->classifier->classify($effectiveMessage);

        // 4. Xử lý intent → lấy data
        $orderHistory = $this->orderInsights->insightsForUser($user, $userType);
        [$contextText, $data, $suggestions] = $this->handleIntent(
            $intent,
            $effectiveMessage,
            $user,
            $userType,
            $branchId,
            $sessionContext,
            $orderHistory,
        );

        // 4b. Cập nhật bộ nhớ phiên
        $sessionContext = $this->sessionMemory->updateFromTurn(
            $sessionContext,
            $message,
            $intent,
            $data,
        );
        $conversation->update(['session_context' => $sessionContext]);

        // 5. Build GPT messages (context 10 tin gần nhất)
        $history = $conversation->messages()
            ->where('role', '!=', 'tool')
            ->orderByDesc('created')
            ->limit(10)
            ->get()
            ->reverse()
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->all();

        $memoryContext = $this->buildMemoryContext(
            $sessionContext,
            $orderHistory,
            $branchId,
        );
        $systemPrompt = $this->buildSystemPrompt($userType, $contextText."\n\n".$memoryContext);

        $gptMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $history,
            [['role' => 'user', 'content' => $message]],
        );

        // 6. Gọi OpenAI (HTTP — cùng pattern với AiProductEnrichmentService)
        [$reply, $tokensUsed] = $this->callOpenAi($gptMessages);

        // 7. Lưu reply của AI
        $aiMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'assistant',
            'content'         => $reply,
            'intent'          => $intent,
            'tokens_used'     => $tokensUsed,
        ]);

        return [
            'conversation_id' => $conversation->id,
            'message_id'      => $aiMsg->id,
            'reply'           => $reply,
            'intent'          => $intent,
            'data'            => $data,
            'suggestions'     => $suggestions,
            'memory'          => [
                'interests' => (array) ($sessionContext['interests'] ?? []),
                'brands' => (array) ($sessionContext['brands'] ?? []),
                'last_search_query' => $sessionContext['last_search_query'] ?? null,
                'order_insights' => [
                    'top_products' => $orderHistory['top_products'],
                    'top_categories' => $orderHistory['top_categories'],
                ],
            ],
        ];
    }

    /**
     * @return array{0: string, 1: array, 2: string[]}
     */
    /**
     * @param  array<string, mixed>  $sessionContext
     * @param  array{top_products: array, top_categories: array, summary: string}  $orderHistory
     */
    private function handleIntent(
        string $intent,
        string $message,
        Authenticatable $user,
        string $userType,
        ?int $branchId,
        array $sessionContext,
        array $orderHistory,
    ): array {
        $isAdmin = $userType === 'admin';

        return match ($intent) {

            IntentClassifier::INTERNAL_SEARCH => $this->handleInternalSearch(
                $message, $isAdmin, $branchId, $sessionContext, $orderHistory,
            ),

            IntentClassifier::PRICE_INQUIRY => $this->handlePriceInquiry($message, $isAdmin),

            IntentClassifier::ORDER_STATUS => $this->handleOrderStatus($user, $userType),

            IntentClassifier::INVOICE_INQUIRY => $this->handleInvoiceInquiry($user, $userType, $isAdmin),

            IntentClassifier::RAKUTEN_DISCOVER => $this->handleProductDiscovery(
                $message, false, $branchId, $sessionContext, $orderHistory,
            ),

            IntentClassifier::POLICY_QUESTION => [
                "Chính sách hệ thống:\n- Phí dịch vụ mặc định: 5%\n- Thời gian giao hàng: 7-14 ngày\n- Thanh toán: chuyển khoản sau khi nhận hóa đơn",
                [],
                ['Xem chi tiết phí dịch vụ', 'Quy trình đặt hàng', 'Liên hệ hỗ trợ'],
            ],

            default => ['', [], ['Tìm sản phẩm', 'Kiểm tra đơn hàng', 'Hỏi về giá']],
        };
    }

    /**
     * @param  array<string, mixed>  $sessionContext
     * @param  array{top_products: array, top_categories: array, summary: string}  $orderHistory
     * @return array{0: string, 1: array, 2: string[]}
     */
    private function handleInternalSearch(
        string $message,
        bool $isAdmin,
        ?int $branchId,
        array $sessionContext,
        array $orderHistory,
    ): array {
        return $this->handleProductDiscovery(
            $message, $isAdmin, $branchId, $sessionContext, $orderHistory,
        );
    }

    /**
     * Nhân viên ảo: catalog (embedding) trước → Rakuten nếu catalog trống.
     *
     * @return array{0: string, 1: array, 2: string[]}
     */
    /**
     * @param  array<string, mixed>  $sessionContext
     * @param  array{top_products: array, top_categories: array, summary: string}  $orderHistory
     */
    private function handleProductDiscovery(
        string $message,
        bool $isAdmin,
        ?int $branchId,
        array $sessionContext,
        array $orderHistory,
    ): array {
        $searchQuery = $this->queryNormalizer->extract($message);
        $searchQuery = $this->enrichSearchQuery(
            $searchQuery,
            $sessionContext,
            $orderHistory,
            $branchId,
        );
        $rakutenKeyword = $this->keywordTranslator->buildRakutenKeyword($searchQuery, $branchId);

        $meta = $this->embeddingService->searchWithMeta($searchQuery, 5);
        $catalogItems = $meta['items'];
        $rate = $this->currentRate();

        $productData = array_map(function (array $item) use ($isAdmin) {
            $row = [
                'id' => $item['id'],
                'product_name' => $item['product_name'] ?? '',
                'name_vi' => $item['name_vi'] ?? null,
                'product_name_jp' => $item['product_name_jp'] ?? null,
                'price_vnd' => (int) ($item['price_vnd'] ?? 0),
                'cost_jpy' => isset($item['cost_jpy']) ? (int) $item['cost_jpy'] : null,
                'image_url' => $item['image_url'] ?? null,
                'source' => 'catalog',
            ];
            return $row;
        }, $catalogItems);

        $rakutenItems = [];
        $rakutenError = null;

        if (count($catalogItems) < 3) {
            $webMeta = $this->webSearchService->searchWithMeta($searchQuery);
            $rakutenError = $webMeta['rakuten_error'];
            $rakutenItems = array_slice($webMeta['items'], 0, 5);
        }

        $contextParts = [
            "Yêu cầu khách: \"{$message}\"",
            "Từ khóa tìm: \"{$searchQuery}\"",
            "GPT mở rộng catalog: \"{$meta['expanded_query']}\"",
            "Từ khóa Rakuten (JP): \"{$rakutenKeyword}\"",
            'Chế độ tìm catalog: '.($meta['search_mode'] ?? 'keyword'),
        ];

        if ($orderHistory['summary'] !== '') {
            $contextParts[] = $orderHistory['summary'];
        }

        if ($productData !== []) {
            $names = collect($productData)->map(fn ($p) => $p['name_vi'] ?: $p['product_name'])->join(', ');
            $contextParts[] = 'Catalog nội bộ ('.count($productData).' SP): '.$names;
        } else {
            $contextParts[] = 'Catalog nội bộ: không có kết quả phù hợp.';
        }

        if ($rakutenItems !== []) {
            $rakutenNames = collect($rakutenItems)->pluck('product_name_vn')->filter()->take(5)->join(', ');
            $contextParts[] = 'Gợi ý từ Rakuten ('.count($rakutenItems).' SP): '.$rakutenNames;
            $contextParts[] = 'Hướng dẫn khách vào màn AI Center → Khám phá web để xem đầy đủ và gửi duyệt.';
        } elseif ($rakutenError) {
            $contextParts[] = "Rakuten chưa tra cứu được (mã {$rakutenError}).";
        }

        $context = implode("\n", $contextParts);

        $suggestions = match (true) {
            $productData !== [] && $rakutenItems !== [] => [
                'So sánh giá catalog vs Rakuten',
                'Tạo đơn từ catalog',
                'Khám phá thêm trên Rakuten',
            ],
            $productData !== [] => [
                'Xem chi tiết sản phẩm đầu tiên',
                'Tìm thêm sản phẩm tương tự',
                'Tạo đơn hàng',
            ],
            $rakutenItems !== [] => [
                'Mở AI Center — Khám phá web',
                'Thử từ khóa khác',
                'Liên hệ admin nhập hàng',
            ],
            default => [
                'Thử từ khóa ngắn hơn (vd: mỹ phẩm, vitamin C)',
                'Mở AI Center — Khám phá web',
                'Xem toàn bộ sản phẩm',
            ],
        };

        return [
            $context,
            [
                'search_query' => $searchQuery,
                'expanded_query' => $meta['expanded_query'],
                'rakuten_keyword' => $rakutenKeyword,
                'products' => $productData,
                'rakuten_suggestions' => $rakutenItems,
                'exchange_rate' => $rate,
            ],
            $suggestions,
        ];
    }

    /** @return array{0: string, 1: array, 2: string[]} */
    private function handlePriceInquiry(string $query, bool $isAdmin): array
    {
        $rate = $this->currentRate();
        $context = "Tỷ giá hiện tại: 1 JPY = {$rate} VND.\n";
        $context .= $isAdmin
            ? 'Giá vốn và giá bán đều hiển thị cho Admin.'
            : 'Giá hiển thị là giá bán (đã bao gồm phí dịch vụ).';

        return [
            $context,
            ['exchange_rate' => $rate],
            ['Xem giá sản phẩm cụ thể', 'Tính toán chi phí đơn hàng', 'Xem lịch sử tỷ giá'],
        ];
    }

    /** @return array{0: string, 1: array, 2: string[]} */
    private function handleOrderStatus(Authenticatable $user, string $userType): array
    {
        $query = Order::query()->active()->orderByDesc('created')->limit(5);

        if ($userType === 'company') {
            $query->where('company_vn_id', $user->id);
        } elseif (str_starts_with($userType, 'branch_')) {
            $query->where('branch_id', $user->branch_id ?? 0);
        }

        $orders = $query->get(['id', 'order_no', 'status', 'created', 'total_vnd']);

        $statusLabels = [
            'DRAFT'            => 'Nháp',
            'PENDING'          => 'Chờ xác nhận',
            'CONFIRMED'        => 'Đã xác nhận',
            'PROCESSING'       => 'Đang xử lý',
            'SHIPPED'          => 'Đã giao vận',
            'DELIVERED_ADMIN'  => 'Đã giao (Admin)',
            'COMPLETED'        => 'Hoàn thành',
            'CANCELLED'        => 'Đã hủy',
        ];

        $orderData = $orders->map(fn ($o) => [
            'order_no'   => $o->order_no,
            'status'     => $statusLabels[$o->status] ?? $o->status,
            'created_at' => $o->created?->format('d/m/Y'),
            'total_vnd'  => number_format((int) $o->total_vnd) . ' ₫',
        ])->all();

        $context = $orders->isEmpty()
            ? 'Không có đơn hàng nào.'
            : '5 đơn gần nhất: ' . $orders->map(fn ($o) => $o->order_no . ' (' . ($statusLabels[$o->status] ?? $o->status) . ')')->join(', ');

        return [
            $context,
            ['orders' => $orderData],
            ['Xem tất cả đơn hàng', 'Tạo đơn hàng mới', 'Liên hệ hỗ trợ'],
        ];
    }

    /** @return array{0: string, 1: array, 2: string[]} */
    private function handleInvoiceInquiry(Authenticatable $user, string $userType, bool $isAdmin): array
    {
        $query = Invoice::query()->orderByDesc('invoice_date')->limit(5);

        if ($userType === 'company') {
            $query->where('company_vn_id', $user->id);
        } elseif (str_starts_with($userType, 'branch_')) {
            $query->where('branch_id', $user->branch_id ?? 0);
        }

        $invoices = $query->get(['id', 'invoice_no', 'status', 'total_amount', 'due_date']);

        $totalDebt = $invoices->whereIn('status', ['SENT', 'OVERDUE'])->sum('total_amount');

        $context = $invoices->isEmpty()
            ? 'Không có hóa đơn nào.'
            : "Tổng công nợ chưa thanh toán: " . number_format((int) $totalDebt) . ' ₫. ' .
              '5 hóa đơn gần nhất: ' . $invoices->pluck('invoice_no')->join(', ');

        return [
            $context,
            ['invoices' => $invoices->toArray(), 'total_debt_vnd' => (int) $totalDebt],
            ['Xem chi tiết hóa đơn', 'Kiểm tra hạn thanh toán', 'Liên hệ kế toán'],
        ];
    }

    private function currentRate(): float
    {
        $rate = ExchangeRate::query()
            ->where('from_currency', 'JPY')
            ->where('to_currency', 'VND')
            ->where('apply_date', '<=', now()->toDateString())
            ->orderByDesc('apply_date')
            ->value('rate');

        return (float) ($rate ?? 170.5);
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array{0: string, 1: int|null}
     */
    private function callOpenAi(array $messages): array
    {
        $apiKey = config('services.openai.api_key');
        if (! $apiKey) {
            return [
                'AI nhân viên chưa được cấu hình (thiếu OPENAI_API_KEY). Vui lòng liên hệ quản trị viên.',
                null,
            ];
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(60)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => config('services.openai.model', 'gpt-4o-mini'),
                    'messages'    => $messages,
                    'max_tokens'  => 800,
                    'temperature' => 0.4,
                ]);

            if (! $response->successful()) {
                Log::warning('AI chat OpenAI failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return [
                    'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau.',
                    null,
                ];
            }

            $body = $response->json();
            $reply = $body['choices'][0]['message']['content']
                ?? 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.';
            $tokensUsed = isset($body['usage']['total_tokens'])
                ? (int) $body['usage']['total_tokens']
                : null;

            return [$reply, $tokensUsed];
        } catch (\Throwable $e) {
            Log::warning('AI chat OpenAI exception', ['error' => $e->getMessage()]);

            return [
                'Xin lỗi, tôi đang gặp sự cố kết nối AI. Vui lòng thử lại sau.',
                null,
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $sessionContext
     * @param  array{top_products: array, top_categories: array, summary: string}  $orderHistory
     */
    private function buildMemoryContext(
        array $sessionContext,
        array $orderHistory,
        ?int $branchId,
    ): string {
        $parts = array_filter([
            $this->sessionMemory->buildContextSummary($sessionContext),
            $orderHistory['summary'] !== '' ? $orderHistory['summary'] : null,
            $this->teachingCatalog->buildPromptContext($branchId) ?: null,
        ]);

        return $parts === [] ? '' : "Bộ nhớ nghiệp vụ:\n".implode("\n", $parts);
    }

    /**
     * @param  array<string, mixed>  $sessionContext
     * @param  array{top_products: array, top_categories: array, summary: string}  $orderHistory
     */
    private function enrichSearchQuery(
        string $searchQuery,
        array $sessionContext,
        array $orderHistory,
        ?int $branchId,
    ): string {
        if (mb_strlen($searchQuery) >= 4) {
            return $searchQuery;
        }

        $interests = (array) ($sessionContext['interests'] ?? []);
        $fromTeaching = $this->teachingCatalog->suggestSearchFromInterests($interests, $branchId);
        if ($fromTeaching !== null) {
            return $fromTeaching;
        }

        $topProduct = $orderHistory['top_products'][0]['name'] ?? null;
        if ($topProduct && mb_strlen($searchQuery) < 3) {
            return (string) $topProduct;
        }

        $lastQuery = (string) ($sessionContext['last_search_query'] ?? '');

        return $lastQuery !== '' ? $lastQuery : $searchQuery;
    }

    private function resolveBranchId(Authenticatable $user, string $userType): ?int
    {
        if (str_starts_with($userType, 'branch_') && $user instanceof BranchUser) {
            return (int) $user->branch_id;
        }

        return null;
    }

    private function buildSystemPrompt(string $userType, string $dataContext): string
    {
        $roleDesc = match (true) {
            $userType === 'admin'           => 'Bạn đang hỗ trợ Admin hệ thống. Có thể chia sẻ giá vốn, lợi nhuận, thông tin nội bộ.',
            $userType === 'company'         => 'Bạn đang hỗ trợ đại lý. Chỉ chia sẻ giá bán, không tiết lộ giá vốn.',
            str_starts_with($userType, 'branch_') => 'Bạn đang hỗ trợ nhân viên chi nhánh. Chỉ chia sẻ giá bán.',
            default                         => 'Bạn đang hỗ trợ người dùng hệ thống.',
        };

        return <<<PROMPT
Bạn là nhân viên tư vấn thu mua hàng Nhật Bản — làm việc như nhân viên thật, không như bot tìm kiếm.

{$roleDesc}

Phong cách nhân viên:
- Lắng nghe yêu cầu tự nhiên ("tìm mỹ phẩm tốt", "vitamin C Nhật") → hiểu nhu cầu, không yêu cầu từ khóa kỹ thuật
- Ưu tiên catalog có sẵn (giao nhanh); nếu không có → gợi ý Rakuten + hướng AI Center
- Trình bày 2–5 lựa chọn, nêu giá ¥ và ước tính ₫, ưu điểm ngắn gọn
- Hỏi lại 1 câu nếu thiếu thông tin (ngân sách, số lượng, mục đích dùng)
- Dùng "Bộ nhớ nghiệp vụ" (sở thích phiên + lịch sử đơn) để cá nhân hóa gợi ý
- Khi khách nói "gợi ý thêm" / "tương tự" → dựa vào SP vừa xem hoặc hay đặt

Kiến thức nghiệp vụ:
- Phí dịch vụ mặc định: 5% | Tỷ giá JPY/VND cập nhật hàng ngày
- Quy trình: Đặt đơn → Admin xác nhận → Giao 7–14 ngày
- Hàng: TPCN, mỹ phẩm, đồ gia dụng Nhật (DHC, Shiseido, Orihiro, Fancl...)

Ví dụ cách trả lời:
- Khách: "Tìm mỹ phẩm tốt" → Gợi ý 2–3 dòng mỹ phẩm từ dữ liệu; nếu chỉ có Rakuten → "Em tra trên Rakuten thấy... Anh/chị vào AI Center > Khám phá web để xem ảnh và gửi duyệt nhé."
- Khách: "Vitamin C Nhật giá rẻ" → So sánh vài SP, nêu giá, khuyên lô ≥10 hộp nếu nhập sỉ

Dữ liệu hệ thống (đã tra cứu giúp bạn — chỉ dùng số liệu này):
{$dataContext}

Quy tắc:
- Cùng ngôn ngữ khách dùng (Việt/Nhật/Anh)
- Không bịa tên SP hoặc giá — chỉ dùng dữ liệu ngữ cảnh
- Không tạo đơn thay khách — hướng dẫn vào Đơn hàng / AI Center
PROMPT;
    }
}
