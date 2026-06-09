<?php

namespace App\Http\Controllers\API;

use App\Exceptions\WarehouseException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\BulkImportInventoryRequest;
use App\Http\Requests\Inventory\InventoryCheckRequest;
use App\Http\Requests\Inventory\UpdateInventoryRequest;
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

    public function check(InventoryCheckRequest $request): JsonResponse
    {
        $data = $request->validated();

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

    public function update(UpdateInventoryRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $inventory = $this->inventoryService->updateRecord($id, $request->validated(), $auth['id']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::error('M0002', null, 404);
        }

        return ApiResponse::success([
            'inventory' => new InventoryResource($inventory),
        ], 'M1001');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $this->inventoryService->softDelete($id, $auth['id']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::error('M0002', null, 404);
        }

        return ApiResponse::success(null, 'M1002');
    }

    /**
     * POST /inventories/bulk-import
     * CSV columns: product_cd, warehouse_id, quantity, min_stock_qty, notes
     */
    public function bulkImport(BulkImportInventoryRequest $request): JsonResponse
    {

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return ApiResponse::error('M0001', null, 422);
        }

        $auth = AuthContext::from($request);
        $header = null;
        $imported = 0;
        $errors = [];
        $row = 0;

        while (($line = fgetcsv($handle)) !== false) {
            $row++;
            if ($header === null) {
                $header = array_map('trim', $line);
                continue;
            }
            if (count($line) < 3) continue;

            $data = array_combine($header, array_map('trim', $line));
            if (!$data) continue;

            try {
                $warehouseId = (int) ($data['warehouse_id'] ?? 0);
                $productCd   = $data['product_cd'] ?? null;
                $quantity    = (int) ($data['quantity'] ?? 0);

                if (!$productCd || !$warehouseId) {
                    $errors[] = "Dòng {$row}: thiếu product_cd hoặc warehouse_id";
                    continue;
                }

                $product = \App\Models\Product::query()
                    ->where('product_cd', $productCd)
                    ->where('deleted_flag', false)
                    ->first();

                if (!$product) {
                    $errors[] = "Dòng {$row}: không tìm thấy product_cd={$productCd}";
                    continue;
                }

                $this->inventoryService->stockIn(
                    (int) $product->id,
                    $warehouseId,
                    $quantity,
                    (int) $auth['id'],
                    'Nhập kho CSV bulk import',
                    'csv_import',
                    null,
                    $data['notes'] ?? null,
                );

                // Update min_stock_qty if provided
                if (!empty($data['min_stock_qty'])) {
                    $inv = \App\Models\Inventory::query()
                        ->where('product_id', $product->id)
                        ->where('warehouse_id', $warehouseId)
                        ->first();
                    if ($inv) {
                        $inv->update(['min_stock_qty' => (int) $data['min_stock_qty']]);
                    }
                }

                $imported++;
            } catch (\Throwable $e) {
                $errors[] = "Dòng {$row}: " . $e->getMessage();
            }
        }

        fclose($handle);

        return ApiResponse::success([
            'imported' => $imported,
            'errors' => $errors,
            'total_rows' => $row - 1,
        ], $imported > 0 ? 'M0200' : 'M0001');
    }
}
