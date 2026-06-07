<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

/**
 * Luồng A: Rakuten API (ưu tiên, ảnh + link thật) → chỉ dùng OpenAI khi chưa cấu hình Rakuten.
 */
class AiWebProductSearchService
{
    public function __construct(
        private readonly RakutenIchibaSearchService $rakutenSearch,
        private readonly OpenAiProductSearchService $openAiSearch,
        private readonly AiProductEnrichmentService $enrichmentService,
    ) {}

    /**
     * @return array{items: array<int, array<string, mixed>>, rakuten_error: ?string}
     */
    public function searchWithMeta(string $keyword): array
    {
        $limit = (int) config('services.ai_search.limit', 15);
        $limit = min(max($limit, 1), 10);

        if ($this->rakutenSearch->isConfigured()) {
            $rakutenResults = $this->rakutenSearch->search($keyword, $limit);

            if ($rakutenResults !== []) {
                Log::info('AI web search: Rakuten results', ['count' => count($rakutenResults)]);

                return [
                    'items' => $this->enrichmentService->enrich($rakutenResults),
                    'rakuten_error' => null,
                ];
            }

            $error = $this->rakutenSearch->getLastErrorCode();
            Log::warning('AI web search: Rakuten failed', ['error' => $error]);

            return [
                'items' => [],
                'rakuten_error' => $error,
            ];
        }

        $openAiResults = $this->openAiSearch->search($keyword);

        $openAiResults = array_map(function (array $item) {
            $item['data_source'] = $item['data_source'] ?? 'openai_guess';
            unset($item['source_url']);

            return $item;
        }, $openAiResults);

        return [
            'items' => $this->enrichmentService->enrich($openAiResults),
            'rakuten_error' => null,
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
