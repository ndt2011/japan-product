<?php

namespace App\Http\Controllers\API;

use App\Exceptions\WarehouseException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StockMovement\StoreStockMovementRequest;
use App\Http\Resources\StockMovementResource;
use App\Services\InventoryService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->inventoryService->listMovements(
            $request->only(['product_id', 'warehouse_id', 'movement_type', 'from_date', 'to_date', 'per_page']),
        );

        $summary = $this->inventoryService->movementSummary(
            $request->only(['warehouse_id', 'from_date', 'to_date']),
        );

        return ApiResponse::success([
            'summary' => $summary,
            'items' => StockMovementResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreStockMovementRequest $request): JsonResponse
    {
        $data = $request->validated();

        $auth = AuthContext::from($request);

        try {
            $movement = $data['movement_type'] === 'IN'
                ? $this->inventoryService->stockIn(
                    (int) $data['product_id'],
                    (int) $data['warehouse_id'],
                    (int) $data['quantity'],
                    $auth['id'],
                    $data['reason'] ?? '',
                    $data['ref_type'] ?? null,
                    isset($data['ref_id']) ? (int) $data['ref_id'] : null,
                    $data['note'] ?? null,
                )
                : $this->inventoryService->stockOut(
                    (int) $data['product_id'],
                    (int) $data['warehouse_id'],
                    (int) $data['quantity'],
                    $auth['id'],
                    $data['reason'] ?? '',
                    $data['ref_type'] ?? null,
                    isset($data['ref_id']) ? (int) $data['ref_id'] : null,
                    $data['note'] ?? null,
                );
        } catch (WarehouseException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'movement' => new StockMovementResource($movement),
        ], 'M1001', 201);
    }
}
