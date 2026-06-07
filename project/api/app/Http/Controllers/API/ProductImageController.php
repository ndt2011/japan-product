<?php

namespace App\Http\Controllers\API;

use App\Exceptions\ProductException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductImageRequest;
use App\Http\Requests\Product\UpdateProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Services\ProductImageService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ProductImageController extends Controller
{
    public function __construct(
        private readonly ProductImageService $productImageService,
    ) {}

    public function index(int $productId): JsonResponse
    {
        try {
            $images = $this->productImageService->list($productId);
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'items' => ProductImageResource::collection($images),
        ]);
    }

    public function store(StoreProductImageRequest $request, int $productId): JsonResponse
    {
        try {
            if ($request->hasFile('images')) {
                $uploaded = $this->productImageService->uploadMany(
                    $productId,
                    $request->file('images'),
                    true,
                );

                return ApiResponse::success([
                    'items' => ProductImageResource::collection(collect($uploaded)),
                ], 'M0301', 201);
            }

            $image = $this->productImageService->store(
                $productId,
                $request->file('image'),
                (bool) $request->boolean('is_primary'),
            );
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'image' => new ProductImageResource($image),
        ], 'M0301', 201);
    }

    public function setPrimary(int $productId, int $imageId): JsonResponse
    {
        try {
            $image = $this->productImageService->setPrimary($productId, $imageId);
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'image' => new ProductImageResource($image),
        ], 'M0301');
    }

    public function reorder(int $productId, \Illuminate\Http\Request $request): JsonResponse
    {
        $data = $request->validate(['ids' => ['required', 'array']]);

        try {
            $this->productImageService->reorder($productId, $data['ids']);
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success(null, 'M0301');
    }

    public function update(UpdateProductImageRequest $request, int $productId, int $imageId): JsonResponse
    {
        try {
            $image = $this->productImageService->update($productId, $imageId, $request->validated());
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'image' => new ProductImageResource($image),
        ], 'M0301');
    }

    public function destroy(int $productId, int $imageId): JsonResponse
    {
        try {
            $this->productImageService->destroy($productId, $imageId);
        } catch (ProductException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success(null, 'M0303');
    }
}
