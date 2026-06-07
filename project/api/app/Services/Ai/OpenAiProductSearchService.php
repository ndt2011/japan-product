<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiProductSearchService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $keyword): array
    {
        $apiKey = config('services.openai.api_key');

        if (! $apiKey) {
            Log::info('OpenAI API key not configured — AI search returns empty');

            return [];
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(25)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You suggest Japanese health supplement products for internal catalog research. '
                                .'Reply JSON: {"items":[...]} max 10. Fields: product_name_jp, price_jpy (integer estimate), '
                                .'source_platform ("rakuten"|"amazon"), description (Japanese). '
                                .'Do NOT invent source_url or image_url — omit those fields entirely.',
                        ],
                        ['role' => 'user', 'content' => "Keyword: {$keyword}"],
                    ],
                    'temperature' => 0.2,
                ]);

            if (! $response->successful()) {
                Log::warning('OpenAI search failed', ['status' => $response->status()]);

                return [];
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || trim($content) === '') {
                return [];
            }

            $items = $this->parseItems($content);

            return $this->normalizeResults($items);
        } catch (\Throwable $e) {
            Log::warning('OpenAI search exception', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * @return array<int, mixed>
     */
    private function parseItems(string $content): array
    {
        $json = $this->extractJsonString($content);
        $decoded = json_decode($json, true);

        if (! is_array($decoded)) {
            return [];
        }

        if (isset($decoded['items']) && is_array($decoded['items'])) {
            return $decoded['items'];
        }

        if (isset($decoded['products']) && is_array($decoded['products'])) {
            return $decoded['products'];
        }

        if (array_is_list($decoded)) {
            return $decoded;
        }

        return [];
    }

    private function extractJsonString(string $content): string
    {
        $trimmed = trim($content);

        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $trimmed, $matches)) {
            return trim($matches[1]);
        }

        return $trimmed;
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
                'image_url' => null,
                'price_jpy' => (int) ($item['price_jpy'] ?? 0),
                'source_url' => null,
                'source_platform' => $item['source_platform'] ?? 'rakuten',
                'description' => $item['description'] ?? null,
                'data_source' => 'openai_guess',
            ];
        }

        return $normalized;
    }
}
