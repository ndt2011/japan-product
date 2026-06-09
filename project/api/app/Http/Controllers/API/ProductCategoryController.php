<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductCategory\StoreProductCategoryRequest;
use App\Http\Requests\ProductCategory\UpdateProductCategoryRequest;
use App\Models\ProductCategory;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Admin CRUD danh mục — V3 #10 */
class ProductCategoryController extends Controller
{
    public function store(StoreProductCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        $category = ProductCategory::query()->create([
            'category_name' => $data['category_name'],
            'order_no' => $data['order_no'] ?? 0,
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ]);

        return ApiResponse::success(['category' => $category], 'M0200', 201);
    }

    public function update(UpdateProductCategoryRequest $request, int $id): JsonResponse
    {
        $category = ProductCategory::query()->where('deleted_flag', false)->findOrFail($id);

        $data = $request->validated();

        $category->update(array_merge($data, ['modified' => now()]));

        return ApiResponse::success(['category' => $category->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = ProductCategory::query()->where('deleted_flag', false)->findOrFail($id);
        $category->update(['deleted_flag' => true, 'deleted' => now()]);

        return ApiResponse::success(null, 'M0200');
    }
}
