<?php

namespace App\Services\Ai;

use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\PurchasingSession;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI Purchasing Specialist — tìm và so sánh sản phẩm Nhật tốt nhất.
 *
 * Luồng 5 bước:
 *   1. Parse yêu cầu (VI/JP) → trích xuất: từ khóa, ngân sách, số lượng
 *   2. Tìm ≥5 sản phẩm từ Rakuten + internal catalog
 *   3. So sánh theo 5 tiêu chí
 *   4. Tính điểm: Price 30% + Quality 30% + Review 20% + Warranty 10% + Brand 10%
 *   5. Sinh báo cáo VI/JP + khuyến nghị
 *
 * spec: docs/sa/amendments/ai-purchasing-specialist.md
 */
class AiPurchasingService
{
    // Brand trust scores (1–10)
    private const TRUSTED_BRANDS = [
        'DHC' => 9, 'FANCL' => 9, 'ファンケル' => 9,
        'パナソニック' => 10, 'Panasonic' => 10,
        'ソニー' => 10, 'Sony' => 10,
        'シャープ' => 9, 'Sharp' => 9,
        '資生堂' => 10, 'Shiseido' => 10,
        'SK-II' => 9,
        'オリヒロ' => 8, 'サントリー' => 9,
        'ピジョン' => 9, 'Pigeon' => 9,
        'ライオン' => 8, 'kao' => 8, '花王' => 8,
        'カルビー' => 8, 'グリコ' => 8,
        'オムロン' => 9, 'OMRON' => 9,
    ];

    public function __construct(
        private readonly RakutenKeywordTranslatorService $keywordTranslator,
        private readonly RakutenIchibaSearchService $rakutenSearch,
        private readonly AiProductEnrichmentService $enrichmentService,
    ) {}

    /**
     * メイン: 購入アドバイスを生成する
     *
     * @param  array<string, mixed>  $params  ['query', 'budget_jpy', 'qty', 'preferences']
     * @return array<string, mixed>
     */
    public function analyze(array $params, Authenticatable $user, string $userType, int $userId): array
    {
        $query = (string) ($params['query'] ?? '');
        $budgetJpy = isset($params['budget_jpy']) ? (int) $params['budget_jpy'] : null;
        $qty = isset($params['qty']) ? (int) $params['qty'] : 1;

        // Step 1: translate keyword
        $jpKeyword = $this->keywordTranslator->buildRakutenKeyword($query);

        // Step 2: search Rakuten (≥5 items)
        $rakutenItems = $this->rakutenSearch->search($jpKeyword, 10);

        // Fallback: search internal catalog
        $internalItems = $this->searchInternal($jpKeyword, $query, 5);

        // Merge & deduplicate by name
        $candidates = $this->mergeResults($rakutenItems, $internalItems, $budgetJpy);

        if (count($candidates) < 1) {
            return [
                'success' => false,
                'message' => "Không tìm thấy sản phẩm phù hợp với từ khóa: {$query}",
            ];
        }

        // Step 3 & 4: score each candidate
        $scored = array_map(fn ($item) => $this->scoreItem($item), $candidates);
        usort($scored, fn ($a, $b) => $b['total_score'] <=> $a['total_score']);

        // Keep top 5
        $top = array_slice($scored, 0, 5);

        // Step 5: generate AI report
        $report = $this->generateReport($query, $jpKeyword, $top, $budgetJpy, $qty, $user);

        $payload = [
            'success' => true,
            'query' => $query,
            'keyword_jp' => $jpKeyword,
            'results' => $top,
            'recommendation' => $top[0] ?? null,
            'report' => $report,
        ];

        $session = PurchasingSession::query()->create([
            'user_type' => $userType,
            'user_id' => $userId,
            'query' => $query,
            'keyword_jp' => $jpKeyword,
            'budget_jpy' => $budgetJpy,
            'qty' => $qty,
            'status' => 'completed',
            'response_json' => $payload,
            'created' => now(),
        ]);

        $payload['session_id'] = $session->id;

        return $payload;
    }

    public function listHistory(string $userType, int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return PurchasingSession::query()
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->orderByDesc('created')
            ->paginate($perPage);
    }

    public function getSession(int $id, string $userType, int $userId): ?PurchasingSession
    {
        return PurchasingSession::query()
            ->where('id', $id)
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->first();
    }

    /** @return array<int, array<string, mixed>> */
    private function searchInternal(string $jpKeyword, string $originalQuery, int $limit): array
    {
        $keywords = array_filter(array_unique([$jpKeyword, $originalQuery]));

        $rows = DB::table('products')
            ->leftJoin('inventories', 'products.id', '=', 'inventories.product_id')
            ->select([
                'products.id',
                'products.product_name',
                'products.product_cd',
                'products.selling_price_jpy',
                'products.price_vnd as price_vnd',
                'products.brand',
                'products.description',
                'inventories.available_qty',
            ])
            ->where('products.deleted_flag', false)
            ->where('products.disabled_flag', false)
            ->where(function ($q) use ($keywords) {
                foreach ($keywords as $kw) {
                    $q->orWhere('products.product_name', 'like', "%{$kw}%")
                      ->orWhere('products.product_name_jp', 'like', "%{$kw}%")
                      ->orWhere('products.name_vi', 'like', "%{$kw}%")
                      ->orWhere('products.brand', 'like', "%{$kw}%");
                }
            })
            ->limit($limit)
            ->get();

        return $rows->map(fn ($r) => [
            'source' => 'internal',
            'id' => $r->id,
            'name' => $r->product_name,
            'name_jp' => $r->product_name,
            'price_jpy' => (int) ($r->selling_price_jpy ?? 0),
            'price_vnd' => (int) ($r->price_vnd ?? 0),
            'brand' => $r->brand ?? null,
            'review_score' => null,
            'review_count' => null,
            'warranty_months' => null,
            'image_url' => null,
            'url' => null,
            'in_stock' => ($r->available_qty ?? 0) > 0,
            'description' => $r->description ?? null,
        ])->toArray();
    }

    /**
     * @param  array<int, mixed>  $rakuten
     * @param  array<int, mixed>  $internal
     * @return array<int, array<string, mixed>>
     */
    private function mergeResults(array $rakuten, array $internal, ?int $budgetJpy): array
    {
        $merged = [];

        foreach ($rakuten as $item) {
            $price = (int) ($item['price_jpy'] ?? $item['price'] ?? 0);
            if ($budgetJpy && $price > $budgetJpy) continue;
            $merged[] = array_merge($item, ['source' => 'rakuten']);
        }

        foreach ($internal as $item) {
            $price = (int) ($item['price_jpy'] ?? 0);
            if ($budgetJpy && $price > 0 && $price > $budgetJpy) continue;
            $merged[] = $item;
        }

        // Deduplicate by normalized name (first 20 chars)
        $seen = [];
        $unique = [];
        foreach ($merged as $item) {
            $key = mb_substr(mb_strtolower((string) ($item['name'] ?? $item['name_jp'] ?? '')), 0, 20);
            if (isset($seen[$key])) continue;
            $seen[$key] = true;
            $unique[] = $item;
        }

        return $unique;
    }

    /**
     * Score item on 5 criteria.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function scoreItem(array $item): array
    {
        $priceJpy = (int) ($item['price_jpy'] ?? $item['price'] ?? 0);

        // Price score (30%): cheaper within 1000–10000 JPY range = higher score
        $priceScore = 5.0;
        if ($priceJpy > 0) {
            if ($priceJpy <= 1000) $priceScore = 10.0;
            elseif ($priceJpy <= 2000) $priceScore = 9.0;
            elseif ($priceJpy <= 3500) $priceScore = 8.0;
            elseif ($priceJpy <= 5000) $priceScore = 7.0;
            elseif ($priceJpy <= 8000) $priceScore = 6.0;
            elseif ($priceJpy <= 15000) $priceScore = 5.0;
            else $priceScore = 4.0;
        }

        // Quality score (30%): based on review score if available
        $reviewScore = (float) ($item['review_score'] ?? 0);
        $qualityScore = $reviewScore > 0 ? round($reviewScore * 2, 1) : 7.0; // default 7

        // Review score (20%): based on review count (popularity)
        $reviewCount = (int) ($item['review_count'] ?? 0);
        $popularityScore = 5.0;
        if ($reviewCount >= 1000) $popularityScore = 10.0;
        elseif ($reviewCount >= 500) $popularityScore = 9.0;
        elseif ($reviewCount >= 100) $popularityScore = 8.0;
        elseif ($reviewCount >= 50) $popularityScore = 7.0;
        elseif ($reviewCount >= 10) $popularityScore = 6.0;
        elseif ($reviewCount > 0) $popularityScore = 5.0;

        // Warranty score (10%)
        $warrantyMonths = (int) ($item['warranty_months'] ?? 0);
        $warrantyScore = $warrantyMonths >= 24 ? 10.0 : ($warrantyMonths >= 12 ? 8.0 : 5.0);

        // Brand score (10%)
        $brand = (string) ($item['brand'] ?? $item['name'] ?? '');
        $brandScore = 5.0;
        foreach (self::TRUSTED_BRANDS as $trustedBrand => $score) {
            if (mb_stripos($brand, $trustedBrand) !== false) {
                $brandScore = (float) $score;
                break;
            }
        }

        // Also check item name for brand
        if ($brandScore === 5.0) {
            $itemName = (string) ($item['name'] ?? $item['name_jp'] ?? '');
            foreach (self::TRUSTED_BRANDS as $trustedBrand => $score) {
                if (mb_stripos($itemName, $trustedBrand) !== false) {
                    $brandScore = (float) $score;
                    break;
                }
            }
        }

        $totalScore = round(
            $priceScore * 0.30 +
            $qualityScore * 0.30 +
            $popularityScore * 0.20 +
            $warrantyScore * 0.10 +
            $brandScore * 0.10,
            2,
        );

        return array_merge($item, [
            'scores' => [
                'price' => $priceScore,
                'quality' => $qualityScore,
                'review' => $popularityScore,
                'warranty' => $warrantyScore,
                'brand' => $brandScore,
            ],
            'total_score' => $totalScore,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $results
     */
    private function generateReport(
        string $query,
        string $jpKeyword,
        array $results,
        ?int $budgetJpy,
        int $qty,
        Authenticatable $user,
    ): string {
        if (empty(config('services.openai.api_key'))) {
            return $this->buildFallbackReport($query, $results);
        }

        $cacheKey = 'ai_purchasing_report_' . md5($query . json_encode(array_column($results, 'name')));

        return Cache::remember($cacheKey, 3600, function () use ($query, $jpKeyword, $results, $budgetJpy, $qty) {
            $topList = '';
            foreach ($results as $i => $r) {
                $no = $i + 1;
                $name = $r['name'] ?? $r['name_jp'] ?? 'Unknown';
                $price = number_format((int) ($r['price_jpy'] ?? 0));
                $score = $r['total_score'] ?? 0;
                $topList .= "#{$no}. {$name} — ¥{$price} JPY — điểm tổng: {$score}/10\n";
            }

            $budgetText = $budgetJpy ? '¥' . number_format($budgetJpy) . ' JPY' : 'không giới hạn';

            $prompt = <<<PROMPT
Bạn là chuyên gia thu mua hàng Nhật. Viết báo cáo so sánh ngắn gọn (dưới 200 từ) bằng tiếng Việt.

Yêu cầu tìm kiếm: "{$query}" (từ khóa JP: {$jpKeyword})
Ngân sách: {$budgetText}
Số lượng cần: {$qty}

Top sản phẩm tìm được:
{$topList}

Hãy:
1. Tóm tắt 1-2 câu về thị trường
2. Giải thích vì sao sản phẩm #1 được khuyến nghị
3. Lưu ý khi nhập khẩu về VN (nếu có)
4. Ước tính lợi nhuận: nếu bán ở VN +15-25% so với giá nhập

Trả về đúng tiếng Việt, ngắn gọn, chuyên nghiệp.
PROMPT;

            try {
                $response = Http::withToken(config('services.openai.api_key'))
                    ->timeout(25)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4o-mini',
                        'temperature' => 0.4,
                        'max_tokens' => 400,
                        'messages' => [
                            ['role' => 'system', 'content' => 'Chuyên gia thu mua hàng Nhật Bản. Trả lời tiếng Việt, súc tích.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                    ]);

                return trim((string) ($response->json('choices.0.message.content') ?? ''));
            } catch (\Throwable $e) {
                Log::warning('AiPurchasingService report failed', ['error' => $e->getMessage()]);

                return $this->buildFallbackReport($query, $results);
            }
        });
    }

    /** @param  array<int, array<string, mixed>>  $results */
    private function buildFallbackReport(string $query, array $results): string
    {
        if (empty($results)) return "Không tìm thấy sản phẩm phù hợp.";

        $top = $results[0];
        $name = $top['name'] ?? $top['name_jp'] ?? 'Sản phẩm';
        $price = number_format((int) ($top['price_jpy'] ?? 0));
        $score = $top['total_score'] ?? 0;

        return "Kết quả tìm kiếm cho \"{$query}\": Sản phẩm được khuyến nghị là {$name} (¥{$price} JPY) với điểm tổng {$score}/10. Đây là lựa chọn tối ưu dựa trên giá cả, chất lượng và độ tin cậy thương hiệu.";
    }
}
