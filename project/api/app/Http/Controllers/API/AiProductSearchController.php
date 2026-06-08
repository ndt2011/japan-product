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

        $payload = [
            'query' => $query,
            'expanded_query' => $meta['expanded_query'],
            'search_mode' => $meta['search_mode'] ?? 'keyword',
            'count' => count($items),
            'items' => $items,
        ];

        if ($items === []) {
            return ApiResponse::success($payload, 'M0201');
        }

        return ApiResponse::success($payload);
    }
}
