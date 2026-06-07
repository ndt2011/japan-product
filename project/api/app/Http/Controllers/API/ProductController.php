<?php

namespace App\Http\Controllers\API;

use App\Exceptions\ProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductImageService;
use App\Services\ProductService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly ProductImageService $productImageService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->productService->list($request->only([
            'search', 'category_id', 'per_page',
        ]));

        return ApiResponse::success([
            'items' => ProductResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            $product = $this->productService->show($id);
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'product' => new ProductResource($product),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            unset($data['images']);
            $product = $this->productService->store($data);

            if ($request->hasFile('images')) {
                $this->productImageService->uploadMany($product->id, $request->file('images'), true);
                $product->refresh();
            }
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'product' => new ProductResource($product->load(['category', 'supplier', 'inventories', 'images'])),
        ], 'M0301', 201);
    }

    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {
        try {
            $product = $this->productService->update($id, $request->validated());
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'product' => new ProductResource($product),
        ], 'M0301');
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->productService->destroy($id);
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success(null, 'M0303');
    }
}
