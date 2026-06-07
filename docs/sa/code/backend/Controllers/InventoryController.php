<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    // GET /inventories?warehouse_id=1&product_id=5
    public function index(Request $request): JsonResponse
    {
        $inventories = Inventory::with(['product:id,product_cd,name_jp', 'warehouse:id,warehouse_name'])
            ->where('deleted_flag', 0)
            ->when($request->warehouse_id, fn($q, $id) => $q->where('warehouse_id', $id))
            ->when($request->product_id,   fn($q, $id) => $q->where('product_id', $id))
            ->get();

        return response()->json(['success' => true, 'data' => $inventories]);
    }

    // POST /stock-movements/stock-in
    public function stockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id'   => 'required|integer|exists:warehouses,id',
            'product_id'     => 'required|integer|exists:products,id',
            'quantity'       => 'required|integer|min:1',
            'reference_type' => 'nullable|string|in:order,manual,import',
            'reference_id'   => 'nullable|integer',
            'note'           => 'nullable|string|max:500',
        ]);

        $movement = $this->inventoryService->stockIn(
            warehouseId   : $validated['warehouse_id'],
            productId     : $validated['product_id'],
            quantity      : $validated['quantity'],
            referenceType : $validated['reference_type'] ?? 'manual',
            referenceId   : $validated['reference_id'] ?? null,
            note          : $validated['note'] ?? null,
            adminId       : $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'M1001',
            'data'    => $movement,
        ], 201);
    }

    // POST /stock-movements/stock-out
    public function stockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id'   => 'required|integer|exists:warehouses,id',
            'product_id'     => 'required|integer|exists:products,id',
            'quantity'       => 'required|integer|min:1',
            'reference_type' => 'nullable|string|in:order,manual',
            'reference_id'   => 'nullable|integer',
            'note'           => 'nullable|string|max:500',
        ]);

        try {
            $movement = $this->inventoryService->stockOut(
                warehouseId   : $validated['warehouse_id'],
                productId     : $validated['product_id'],
                quantity      : $validated['quantity'],
                referenceType : $validated['reference_type'] ?? 'manual',
                referenceId   : $validated['reference_id'] ?? null,
                note          : $validated['note'] ?? null,
                adminId       : $request->user()->id
            );

            return response()->json([
                'success' => true,
                'message' => 'M1002',
                'data'    => $movement,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    // POST /stock-movements/adjust
    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id'    => 'required|integer|exists:warehouses,id',
            'product_id'      => 'required|integer|exists:products,id',
            'actual_quantity' => 'required|integer|min:0',
            'note'            => 'nullable|string|max:500',
        ]);

        $movement = $this->inventoryService->adjust(
            warehouseId    : $validated['warehouse_id'],
            productId      : $validated['product_id'],
            actualQuantity : $validated['actual_quantity'],
            note           : $validated['note'] ?? null,
            adminId        : $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'M1003',
            'data'    => $movement,
        ], 201);
    }

    // GET /stock-movements?warehouse_id=1&product_id=5&type=IN
    public function movements(Request $request): JsonResponse
    {
        $movements = StockMovement::with(['product:id,product_cd,name_jp', 'warehouse:id,warehouse_name'])
            ->when($request->warehouse_id,   fn($q, $id)   => $q->where('warehouse_id', $id))
            ->when($request->product_id,     fn($q, $id)   => $q->where('product_id', $id))
            ->when($request->movement_type,  fn($q, $type) => $q->where('movement_type', $type))
            ->orderByDesc('created')
            ->paginate(50);

        return response()->json(['success' => true, 'data' => $movements]);
    }
}
