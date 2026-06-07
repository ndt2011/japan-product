<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiProductSearchService
{
    public function __construct(
        private readonly MockProductCatalog $catalog,
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $keyword): array
    {
        $apiKey = config('services.openai.api_key');

        if (! $apiKey) {
            return $this->catalog->search($keyword);
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(25)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You help find Japanese health supplement products. Reply with JSON array only, max 10 items. Fields: product_name_jp, price_jpy (int), source_platform (rakuten|amazon), description.',
                        ],
                        ['role' => 'user', 'content' => "Find products for keyword: {$keyword}"],
                    ],
                    'temperature' => 0.2,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenAI search failed, using mock catalog', ['status' => $response->status()]);

                return $this->catalog->search($keyword);
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content)) {
                return $this->catalog->search($keyword);
            }

            $decoded = json_decode(trim($content), true);

            if (! is_array($decoded)) {
                return $this->catalog->search($keyword);
            }

            return $this->normalizeResults($decoded);
        } catch (\Throwable $e) {
            Log::warning('OpenAI search exception, using mock catalog', ['error' => $e->getMessage()]);

            return $this->catalog->search($keyword);
        }
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, array<string, mixed>>
     */
    private function normalizeResults(array $items): array
    {
        $normalized = [];

        foreach (array_slice($items, 0, 10) as $index => $item) {
            if (! is_array($item) || empty($item['product_name_jp'])) {
                continue;
            }

            $normalized[] = [
                'external_id' => 'openai-'.($index + 1),
                'product_name_jp' => (string) $item['product_name_jp'],
                'image_url' => $item['image_url'] ?? 'https://placehold.co/200x200/png?text=AI',
                'price_jpy' => (int) ($item['price_jpy'] ?? 0),
                'source_url' => $item['source_url'] ?? null,
                'source_platform' => $item['source_platform'] ?? 'rakuten',
                'description' => $item['description'] ?? null,
            ];
        }

        return $normalized !== [] ? $normalized : $this->catalog->search('');
    }
}
