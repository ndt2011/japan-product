<?php

namespace App\Services\Ai;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Admin;
use App\Models\ExchangeRate;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Support\AuthContext;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
use OpenAI\Laravel\Facades\OpenAI;

/**
 * AI Chat nhân viên service
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 4-7
 */
class AiChatService
{
    public function __construct(
        private readonly IntentClassifier $classifier,
    ) {}

    /**
     * Xử lý 1 tin nhắn từ user và trả về reply của AI.
     *
     * @param  Authenticatable  $user
     * @param  string  $userType  (admin / company / branch_manager / branch_staff)
     * @param  string  $message
     * @param  int|null  $conversationId
     * @return array{conversation_id: int, message_id: int, reply: string, intent: string, data: array, suggestions: string[]}
     */
    public function chat(
        Authenticatable $user,
        string $userType,
        string $message,
        ?int $conversationId = null,
    ): array {
        // 1. Lấy hoặc tạo conversation
        $conversation = $conversationId
            ? AiConversation::findOrFail($conversationId)
            : AiConversation::create([
                'user_type' => $userType,
                'user_id'   => $user->id,
                'title'     => mb_substr($message, 0, 50),
            ]);

        // 2. Lưu tin nhắn user
        $userMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role'            => 'user',
            'content'         => $message,
        ]);

        // 3. Phân loại intent
        $intent = $this->classifier->classify($message);

        // 4. Xử lý intent → lấy data
        $data        = [];
        $suggestions = [];
        [$contextText, $data, $suggestions] = $this->handleIntent(
            $intent, $message, $user, $userType
        );

        // 5. Build GPT messages (context 10 tin gần nhất)
        $history = $conversation->messages()
            ->where('role', '!=', 'tool')
            ->orderByDesc('created')
            ->limit(10)
            ->get()
            ->reverse()
            ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
            ->all();

        $systemPrompt = $this->buildSystemPrompt($userType, $contextText);

        $gptMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $history,
            [['role' => 'user', 'content' => $message]],
        );

        // 6. Gọi GPT-4o
        $response   = OpenAI::chat()->create([
            'model'       => 'gpt-4o',
            'messages'    => $gptMessages,
            'max_tokens'  => 800,
            'temperature' => 0.4,
        ]);

        $reply      = $response->choices[0]->message->content ?? 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.';
        $tokensUsed = $response->usage?->totalTokens;

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
        ];
    }

    /**
     * @return array{0: string, 1: array, 2: string[]}
     */
    private function handleIntent(
        string $intent,
        string $message,
        Authenticatable $user,
        string $userType,
    ): array {
        $isAdmin = $userType === 'admin';

        return match ($intent) {

            IntentClassifier::INTERNAL_SEARCH => $this->handleInternalSearch($message, $isAdmin),

            IntentClassifier::PRICE_INQUIRY => $this->handlePriceInquiry($message, $isAdmin),

            IntentClassifier::ORDER_STATUS => $this->handleOrderStatus($user, $userType),

            IntentClassifier::INVOICE_INQUIRY => $this->handleInvoiceInquiry($user, $userType, $isAdmin),

            IntentClassifier::POLICY_QUESTION => [
                "Chính sách hệ thống:\n- Phí dịch vụ mặc định: 5%\n- Thời gian giao hàng: 7-14 ngày\n- Thanh toán: chuyển khoản sau khi nhận hóa đơn",
                [],
                ['Xem chi tiết phí dịch vụ', 'Quy trình đặt hàng', 'Liên hệ hỗ trợ'],
            ],

            default => ['', [], ['Tìm sản phẩm', 'Kiểm tra đơn hàng', 'Hỏi về giá']],
        };
    }

    /** @return array{0: string, 1: array, 2: string[]} */
    private function handleInternalSearch(string $query, bool $isAdmin): array
    {
        $products = Product::query()
            ->where('deleted_flag', false)
            ->where('disabled_flag', false)
            ->where(function ($q) use ($query) {
                $q->where('product_name', 'LIKE', "%{$query}%")
                  ->orWhere('product_name_vi', 'LIKE', "%{$query}%")
                  ->orWhere('product_cd', 'LIKE', "%{$query}%");
            })
            ->select(['id', 'product_name', 'product_name_vi', 'selling_price_jpy', 'cost_price_jpy', 'price_vnd', 'fee_rate', 'primary_image_url'])
            ->limit(5)
            ->get();

        $rate = $this->currentRate();

        $productData = $products->map(function ($p) use ($rate, $isAdmin) {
            $item = [
                'id'              => $p->id,
                'product_name'    => $p->product_name,
                'product_name_vi' => $p->product_name_vi,
                'selling_price_jpy' => (int) $p->selling_price_jpy,
                'price_vnd'       => (int) ($p->price_vnd ?? 0),
                'image_url'       => $p->primary_image_url,
            ];
            if ($isAdmin) {
                $item['cost_price_jpy'] = (int) $p->cost_price_jpy;
            }
            return $item;
        })->all();

        $context = $products->isEmpty()
            ? 'Không tìm thấy sản phẩm nào trong catalog nội bộ phù hợp.'
            : 'Tìm thấy ' . $products->count() . ' sản phẩm trong catalog: ' .
              $products->pluck('product_name')->join(', ');

        $suggestions = $products->isEmpty()
            ? ['Tìm sản phẩm mới trên Rakuten', 'Thử từ khóa khác', 'Xem toàn bộ catalog']
            : ['Xem chi tiết sản phẩm đầu tiên', 'Tìm thêm sản phẩm tương tự', 'Tạo đơn hàng ngay'];

        return [$context, ['products' => $productData, 'exchange_rate' => $rate], $suggestions];
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

    private function buildSystemPrompt(string $userType, string $dataContext): string
    {
        $roleDesc = match (true) {
            $userType === 'admin'           => 'Bạn đang hỗ trợ Admin hệ thống. Có thể chia sẻ giá vốn, lợi nhuận, thông tin nội bộ.',
            $userType === 'company'         => 'Bạn đang hỗ trợ đại lý. Chỉ chia sẻ giá bán, không tiết lộ giá vốn.',
            str_starts_with($userType, 'branch_') => 'Bạn đang hỗ trợ nhân viên chi nhánh. Chỉ chia sẻ giá bán.',
            default                         => 'Bạn đang hỗ trợ người dùng hệ thống.',
        };

        return <<<PROMPT
Bạn là nhân viên tư vấn của công ty vận chuyển hàng hóa Nhật-Việt.
Nhiệm vụ: tư vấn sản phẩm chức năng thực phẩm Nhật Bản cho đại lý Việt Nam.

{$roleDesc}

Kiến thức nghiệp vụ:
- Phí dịch vụ mặc định: 5% (có thể khác theo sản phẩm)
- Tỷ giá JPY/VND: cập nhật hàng ngày
- Quy trình: Đại lý tạo đơn → Admin xác nhận → Đóng hàng → Giao hàng (7-14 ngày)
- Hàng hóa: thực phẩm chức năng, dược phẩm OTC, mỹ phẩm Nhật

Dữ liệu ngữ cảnh từ hệ thống:
{$dataContext}

Quy tắc:
- Trả lời bằng cùng ngôn ngữ người dùng dùng (Việt/Nhật/Anh)
- Không bịa thông tin, không chắc → nói rõ cần kiểm tra lại
- Format số tiền: ¥3,200 (JPY), 890.000 ₫ (VND)
- Không tạo đơn hàng thay user — chỉ tư vấn và hướng dẫn vào màn hình tương ứng
PROMPT;
    }
}
