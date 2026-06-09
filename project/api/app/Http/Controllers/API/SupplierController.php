<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Models\SupplierJp;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

/** Admin CRUD nhà cung cấp JP — BE-V3-030 */
class SupplierController extends Controller
{
    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = SupplierJp::query()->create(array_merge($request->validated(), [
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ]));

        return ApiResponse::success(['supplier' => $supplier], 'M0200', 201);
    }

    public function update(UpdateSupplierRequest $request, int $id): JsonResponse
    {
        $supplier = SupplierJp::query()->where('deleted_flag', false)->findOrFail($id);
        $supplier->update(array_merge($request->validated(), ['modified' => now()]));

        return ApiResponse::success(['supplier' => $supplier->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $supplier = SupplierJp::query()->where('deleted_flag', false)->findOrFail($id);
        $supplier->update(['deleted_flag' => true, 'deleted' => now()]);

        return ApiResponse::success(null, 'M0200');
    }
}
