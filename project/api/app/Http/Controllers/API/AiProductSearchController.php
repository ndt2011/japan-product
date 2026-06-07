<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ai\ProductSearchRequest;
use App\Services\ProductEmbeddingService;
use App\Support\ApiResponse;

class AiProductSearchController extends Controller
{
    public function __construct(
        private readonly ProductEmbeddingService $embeddingService,
    ) {}

    public function search(ProductSearchRequest $request)
    {
        $query = $request->validated('query');
        $limit = $request->validated('limit');

        $meta = $this->embeddingService->searchWithMeta($query, $limit);
        $items = $meta['items'];

        if ($items === []) {
            return ApiResponse::success([
                'query' => $query,
                'expanded_query' => $meta['expanded_query'],
                'count' => 0,
                'items' => [],
            ], 'M0201');
        }

        return ApiResponse::success([
            'query' => $query,
            'expanded_query' => $meta['expanded_query'],
            'count' => count($items),
            'items' => $items,
        ]);
    }
}
