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
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly ProductImageService $productImageService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->productService->list($request->only([
            'search', 'category_id', 'per_page', 'stock_status',
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

    public function branchStats(int $id): JsonResponse
    {
        $stats = DB::table('order_details')
            ->join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('branches', 'orders.branch_id', '=', 'branches.id')
            ->where('order_details.product_id', $id)
            ->whereNotNull('orders.branch_id')
            ->where('orders.deleted_flag', false)
            ->where('order_details.deleted_flag', false)
            ->selectRaw('
                branches.id as branch_id,
                branches.branch_name,
                branches.region,
                branches.province,
                SUM(order_details.quantity) as total_ordered,
                SUM(CASE WHEN orders.status IN ("PENDING","CONFIRMED","PROCESSING")
                    THEN order_details.quantity ELSE 0 END) as pending_qty,
                SUM(CASE WHEN orders.status = "DELIVERED"
                    THEN order_details.quantity ELSE 0 END) as delivered_qty,
                MAX(orders.created) as last_order_date
            ')
            ->groupBy('branches.id', 'branches.branch_name', 'branches.region', 'branches.province')
            ->orderByDesc('total_ordered')
            ->get();

        return ApiResponse::success([
            'product_id' => $id,
            'branches' => $stats,
            'total_ordered_all_branches' => $stats->sum('total_ordered'),
        ]);
    }
}
