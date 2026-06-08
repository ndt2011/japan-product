<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

/**
 * Luồng A: Rakuten API (ưu tiên, ảnh + link thật) → chỉ dùng OpenAI khi chưa cấu hình Rakuten.
 *
 * Thay đổi v2 (2026-06-08):
 *   - Inject RakutenKeywordTranslatorService: dịch VI/EN → JP trước khi gọi Rakuten
 *   - Brand normalization: "dhc" → "DHC", "mỹ phẩm tốt" → "コスメ スキンケア おすすめ"
 *   - Fallback: nếu keyword JP không có kết quả → thử keyword gốc
 */
class AiWebProductSearchService
{
    public function __construct(
        private readonly RakutenIchibaSearchService        $rakutenSearch,
        private readonly OpenAiProductSearchService        $openAiSearch,
        private readonly AiProductEnrichmentService        $enrichmentService,
        private readonly RakutenKeywordTranslatorService   $keywordTranslator,
    ) {}

    /**
     * @return array{items: array<int, array<string, mixed>>, rakuten_error: ?string, keyword_used: string}
     */
    public function searchWithMeta(string $keyword): array
    {
        $limit = (int) config('services.ai_search.limit', 15);
        $limit = min(max($limit, 1), 10);

        if ($this->rakutenSearch->isConfigured()) {
            // ── Step 1: Translate keyword to Japanese for Rakuten ──────────────
            $rakutenKeyword = $this->keywordTranslator->buildRakutenKeyword($keyword);

            Log::info('AI web search: keyword translation', [
                'original'  => $keyword,
                'rakuten'   => $rakutenKeyword,
            ]);

            // ── Step 2: Search with translated (Japanese) keyword ──────────────
            $rakutenResults = $this->rakutenSearch->search($rakutenKeyword, $limit);

            // ── Step 3: Fallback — if translated keyword returns nothing, try original ──
            if ($rakutenResults === [] && $rakutenKeyword !== $keyword) {
                Log::info('AI web search: translated keyword returned 0 results, trying original', [
                    'keyword' => $keyword,
                ]);
                $rakutenResults = $this->rakutenSearch->search($keyword, $limit);
            }

            if ($rakutenResults !== []) {
                Log::info('AI web search: Rakuten results', [
                    'count'          => count($rakutenResults),
                    'keyword_used'   => $rakutenKeyword,
                ]);

                return [
                    'items'        => $this->enrichmentService->enrich($rakutenResults),
                    'rakuten_error' => null,
                    'keyword_used' => $rakutenKeyword,
                ];
            }

            $error = $this->rakutenSearch->getLastErrorCode();
            Log::warning('AI web search: Rakuten failed', [
                'error'          => $error,
                'keyword_used'   => $rakutenKeyword,
            ]);

            return [
                'items'        => [],
                'rakuten_error' => $error,
                'keyword_used' => $rakutenKeyword,
            ];
        }

        // ── Fallback to OpenAI (no Rakuten config) ────────────────────────────
        $openAiResults = $this->openAiSearch->search($keyword);

        $openAiResults = array_map(function (array $item) {
            $item['data_source'] = $item['data_source'] ?? 'openai_guess';
            unset($item['source_url']);

            return $item;
        }, $openAiResults);

        return [
            'items'        => $this->enrichmentService->enrich($openAiResults),
            'rakuten_error' => null,
            'keyword_used' => $keyword,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $keyword): array
    {
        return $this->searchWithMeta($keyword)['items'];
    }
}
