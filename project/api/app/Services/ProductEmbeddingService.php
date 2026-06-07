<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductEmbeddingService
{
    private int $limit;

    public function __construct(
        private readonly QueryExpansionService $queryExpansion,
    ) {
        $this->limit = (int) config('services.ai_search.limit', 15);
    }

    public function buildProductText(Product $product): string
    {
        $product->loadMissing(['category', 'supplier']);

        return implode(' | ', array_filter([
            $product->product_name_jp,
            $product->product_name,
            $product->product_cd,
            $product->name_vi ?: $product->product_name,
            $product->description_vi,
            $product->spec,
            $product->description,
            $product->origin,
            $product->category?->category_name,
            $product->supplier?->supplier_name,
        ]));
    }

    /**
     * @return list<float>
     */
    public function getEmbedding(string $text): array
    {
        $apiKey = config('services.openai.api_key');

        if (! $apiKey) {
            throw new \RuntimeException('OPENAI_API_KEY is not configured');
        }

        $response = Http::withToken($apiKey)
            ->timeout(30)
            ->post('https://api.openai.com/v1/embeddings', [
                'model' => config('services.openai.embedding_model', 'text-embedding-3-small'),
                'input' => $text,
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('OpenAI embedding request failed: '.$response->status());
        }

        $embedding = $response->json('data.0.embedding');

        if (! is_array($embedding)) {
            throw new \RuntimeException('Invalid embedding response from OpenAI');
        }

        return array_map('floatval', $embedding);
    }

    public function embedProduct(Product $product): void
    {
        $text = $this->buildProductText($product);
        $embedding = $this->getEmbedding($text);

        $product->update([
            'embedding' => $embedding,
            'embedding_updated_at' => now(),
        ]);
    }

    /**
     * @return array{items: list<array<string, mixed>>, expanded_query: string}
     */
    public function searchWithMeta(string $query, ?int $limit = null): array
    {
        $limit = min(max($limit ?? $this->limit, 1), 20);
        $expandedQuery = $this->queryExpansion->expand($query);

        if (! config('services.openai.api_key')) {
            return [
                'items' => $this->searchByKeyword($expandedQuery, $limit),
                'expanded_query' => $expandedQuery,
            ];
        }

        $embeddedCount = Product::query()
            ->active()
            ->where('disabled_flag', false)
            ->whereNotNull('embedding')
            ->count();

        if ($embeddedCount === 0) {
            Log::info('No product embeddings found, using keyword fallback');

            return [
                'items' => $this->searchByKeyword($expandedQuery, $limit),
                'expanded_query' => $expandedQuery,
            ];
        }

        try {
            $queryVector = $this->getEmbedding($expandedQuery);
        } catch (\Throwable $e) {
            Log::warning('Embedding search failed, using keyword fallback', ['error' => $e->getMessage()]);

            return [
                'items' => $this->searchByKeyword($expandedQuery, $limit),
                'expanded_query' => $expandedQuery,
            ];
        }

        $products = Product::query()
            ->with([
                'category:id,category_name',
                'supplier:id,supplier_name',
                'images' => fn ($q) => $q->where('deleted_flag', false)
                    ->orderByDesc('is_primary')
                    ->orderBy('order_no'),
            ])
            ->active()
            ->where('disabled_flag', false)
            ->whereNotNull('embedding')
            ->get();

        if ($products->isEmpty()) {
            return ['items' => [], 'expanded_query' => $expandedQuery];
        }

        $scored = $products->map(function (Product $product) use ($queryVector) {
            $productVector = $product->embedding ?? [];

            return [
                'product' => $product,
                'similarity' => $this->cosineSimilarity($queryVector, $productVector),
            ];
        });

        $items = $scored
            ->sortByDesc('similarity')
            ->take($limit)
            ->values()
            ->map(fn (array $item) => $this->formatProduct($item['product'], $item['similarity']))
            ->all();

        return ['items' => $items, 'expanded_query' => $expandedQuery];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function search(string $query, ?int $limit = null): array
    {
        return $this->searchWithMeta($query, $limit)['items'];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchByKeyword(string $query, int $limit): array
    {
        $terms = array_values(array_filter(preg_split('/\s+/u', mb_strtolower(trim($query))) ?: []));

        $products = Product::query()
            ->with([
                'category:id,category_name',
                'supplier:id,supplier_name',
                'images' => fn ($q) => $q->where('deleted_flag', false)
                    ->orderByDesc('is_primary')
                    ->orderBy('order_no'),
            ])
            ->active()
            ->where('disabled_flag', false)
            ->when($terms !== [], function (Builder $builder) use ($terms) {
                $builder->where(function (Builder $q) use ($terms) {
                    foreach ($terms as $term) {
                        $like = '%'.$term.'%';
                        $q->orWhereRaw('LOWER(product_name) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(product_name_jp) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(name_vi) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(description_vi) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(product_cd) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(description) LIKE ?', [$like]);
                    }
                });
            })
            ->limit($limit)
            ->get();

        return $products
            ->map(fn (Product $product, int $index) => $this->formatProduct(
                $product,
                max(0.5, 1 - ($index * 0.05)),
            ))
            ->all();
    }

    private function formatProduct(Product $product, float $similarity): array
    {
        $primaryImage = $product->images->firstWhere('is_primary', true)
            ?? $product->images->first();

        $primaryImageUrl = $primaryImage?->image_path ?? $product->image_path;

        return [
            'id' => $product->id,
            'product_cd' => $product->product_cd,
            'product_name' => $product->product_name,
            'product_name_jp' => $product->product_name_jp,
            'name_vi' => $product->name_vi,
            'description_vi' => $product->description_vi,
            'spec' => $product->spec,
            'unit' => $product->unit,
            'cost_jpy' => $product->cost_jpy,
            'price_vnd' => $product->price_vnd,
            'origin' => $product->origin,
            'import_tax_rate' => $product->import_tax_rate,
            'category' => $product->category?->category_name,
            'supplier' => $product->supplier?->supplier_name,
            'image_url' => $primaryImageUrl,
            'ai_score' => round($similarity, 4),
            'images' => $product->images->map(fn ($img) => [
                'url' => $img->image_path,
                'is_primary' => (bool) $img->is_primary,
                'order_no' => $img->order_no,
            ])->values()->all(),
        ];
    }

    /**
     * @param  list<float>  $a
     * @param  list<float>  $b
     */
    private function cosineSimilarity(array $a, array $b): float
    {
        if ($a === [] || $b === [] || count($a) !== count($b)) {
            return 0.0;
        }

        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $i => $val) {
            $dot += $val * $b[$i];
            $normA += $val * $val;
            $normB += $b[$i] * $b[$i];
        }

        if ($normA === 0.0 || $normB === 0.0) {
            return 0.0;
        }

        return $dot / (sqrt($normA) * sqrt($normB));
    }
}
