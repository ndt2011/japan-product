<?php

namespace App\Services\Ai;

use App\Models\ProductCategory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiProductEnrichmentService
{
    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    public function enrich(array $items): array
    {
        if ($items === [] || ! config('services.openai.api_key')) {
            return $items;
        }

        $categories = ProductCategory::query()
            ->where('disabled_flag', false)
            ->where('deleted_flag', false)
            ->orderBy('order_no')
            ->get(['id', 'category_name']);

        if ($categories->isEmpty()) {
            return $items;
        }

        try {
            $categoryList = $categories
                ->map(fn ($c) => "{$c->id}: {$c->category_name}")
                ->implode('; ');

            $payload = array_map(fn (array $item) => [
                'product_name_jp' => $item['product_name_jp'] ?? '',
                'price_jpy' => $item['price_jpy'] ?? null,
                'description' => $item['description'] ?? null,
                'genre_name' => $item['genre_name'] ?? null,
                'source_platform' => $item['source_platform'] ?? null,
            ], array_slice($items, 0, 10));

            $response = Http::withToken(config('services.openai.api_key'))
                ->timeout(35)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.2,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You enrich Japanese product import catalog data for a Vietnam company. '
                                .'Reply JSON: {"items":[...]} same order as input. '
                                .'Each item: product_name_vn (Vietnamese name), suggested_category_id (int from list), '
                                .'suggested_category_name, spec (package size e.g. "360 viên / 60 ngày"), '
                                .'usage_instructions (Vietnamese, how to use dosage warnings), '
                                .'description (Vietnamese summary 2-4 sentences: công dụng, đối tượng, lưu ý). '
                                ."Categories: {$categoryList}",
                        ],
                        ['role' => 'user', 'content' => json_encode(['items' => $payload], JSON_UNESCAPED_UNICODE)],
                    ],
                ]);

            if (! $response->successful()) {
                Log::warning('AI enrichment failed', ['status' => $response->status()]);

                return $items;
            }

            $content = $response->json('choices.0.message.content');

            if (! is_string($content)) {
                return $items;
            }

            $decoded = json_decode($this->extractJsonString($content), true);
            $enrichedRows = $decoded['items'] ?? [];

            if (! is_array($enrichedRows)) {
                return $items;
            }

            foreach ($items as $index => &$item) {
                $row = $enrichedRows[$index] ?? null;

                if (! is_array($row)) {
                    continue;
                }

                if (! empty($row['product_name_vn'])) {
                    $item['product_name_vn'] = $row['product_name_vn'];
                }

                if (! empty($row['suggested_category_id'])) {
                    $item['suggested_category_id'] = (int) $row['suggested_category_id'];
                }

                if (! empty($row['suggested_category_name'])) {
                    $item['suggested_category_name'] = $row['suggested_category_name'];
                }

                if (! empty($row['spec'])) {
                    $item['spec'] = $row['spec'];
                }

                if (! empty($row['usage_instructions'])) {
                    $item['usage_instructions'] = $row['usage_instructions'];
                }

                if (! empty($row['description'])) {
                    $item['description'] = $row['description'];
                }
            }
            unset($item);
        } catch (\Throwable $e) {
            Log::warning('AI enrichment exception', ['error' => $e->getMessage()]);
        }

        return $items;
    }

    private function extractJsonString(string $content): string
    {
        $trimmed = trim($content);

        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $trimmed, $matches)) {
            return trim($matches[1]);
        }

        return $trimmed;
    }
}
