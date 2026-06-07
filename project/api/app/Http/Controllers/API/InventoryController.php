<?php

namespace App\Http\Controllers\API;

use App\Exceptions\WarehouseException;
use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryResource;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->inventoryService->listInventories(
            $request->only(['warehouse_id', 'product_id', 'low_stock', 'per_page']),
        );

        return ApiResponse::success([
            'items' => InventoryResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.actual_qty' => ['required', 'integer', 'min:0'],
            'items.*.note' => ['nullable', 'string'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $auth = AuthContext::from($request);

        try {
            $result = $this->inventoryService->inventoryCheck(
                (int) $data['warehouse_id'],
                $data['items'],
                $auth['id'],
                $data['reason'] ?? 'Kiểm kê định kỳ',
            );
        } catch (WarehouseException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success($result, 'M1003');
    }
}
