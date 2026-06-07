<?php

namespace App\Http\Controllers;

use App\Services\ProductImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function __construct(private readonly ProductImageService $imageService) {}

    // GET /products/{productId}/images
    public function index(int $productId): JsonResponse
    {
        $images = \App\Models\ProductImage::where('product_id', $productId)
            ->where('deleted_flag', 0)
            ->orderBy('order_no')
            ->get()
            ->map(fn($img) => [
                'id'         => $img->id,
                'image_path' => $img->image_path,
                'image_url'  => $this->imageService->getUrl($img->image_path),
                'is_primary' => (bool) $img->is_primary,
                'order_no'   => $img->order_no,
            ]);

        return response()->json(['success' => true, 'data' => $images]);
    }

    // POST /products/{productId}/images
    // ⚠️  Client KHÔNG được set Content-Type header — để browser tự set với boundary
    public function store(Request $request, int $productId): JsonResponse
    {
        $request->validate([
            'images'               => 'required|array|min:1|max:8',
            'images.*'             => 'required|image|mimes:jpeg,png,webp,gif|max:5120',
            'primary_image_index'  => 'nullable|integer|min:0',
        ]);

        // Kiểm tra tổng ảnh không vượt quá 8
        $existing = \App\Models\ProductImage::where('product_id', $productId)
            ->where('deleted_flag', 0)
            ->count();

        $incoming = count($request->file('images'));

        if ($existing + $incoming > 8) {
            return response()->json([
                'success' => false,
                'message' => "M5002: Tối đa 8 ảnh/sản phẩm. Hiện có {$existing} ảnh.",
            ], 422);
        }

        $images = $this->imageService->uploadMany(
            $request->file('images'),
            $productId,
            $request->integer('primary_image_index', 0)
        );

        return response()->json([
            'success' => true,
            'message' => 'M2001',
            'data'    => $images,
        ], 201);
    }

    // PUT /products/{productId}/images/{imageId}/primary
    public function setPrimary(int $productId, int $imageId): JsonResponse
    {
        $image = $this->imageService->setPrimary($imageId, $productId);

        return response()->json(['success' => true, 'data' => $image]);
    }

    // PUT /products/{productId}/images/reorder
    public function reorder(Request $request, int $productId): JsonResponse
    {
        $request->validate([
            'ordered_ids'   => 'required|array',
            'ordered_ids.*' => 'required|integer',
        ]);

        $this->imageService->reorder($request->ordered_ids, $productId);

        return response()->json(['success' => true, 'message' => 'M0010']);
    }

    // DELETE /products/{productId}/images/{imageId}
    public function destroy(int $productId, int $imageId): JsonResponse
    {
        $this->imageService->delete($imageId, $productId);

        return response()->json(['success' => true, 'message' => 'M0200']);
    }
}
