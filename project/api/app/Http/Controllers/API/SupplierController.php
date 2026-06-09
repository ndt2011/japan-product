<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SupplierJp;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Admin CRUD nhà cung cấp JP — BE-V3-030 */
class SupplierController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_cd' => ['nullable', 'string', 'max:50'],
            'supplier_name' => ['required', 'string', 'max:255'],
            'supplier_name_jp' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'tel' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'memo' => ['nullable', 'string'],
        ]);

        $supplier = SupplierJp::query()->create(array_merge($data, [
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ]));

        return ApiResponse::success(['supplier' => $supplier], 'M0200', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $supplier = SupplierJp::query()->where('deleted_flag', false)->findOrFail($id);

        $data = $request->validate([
            'supplier_cd' => ['nullable', 'string', 'max:50'],
            'supplier_name' => ['sometimes', 'string', 'max:255'],
            'supplier_name_jp' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'tel' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'memo' => ['nullable', 'string'],
            'disabled_flag' => ['nullable', 'boolean'],
        ]);

        $supplier->update(array_merge($data, ['modified' => now()]));

        return ApiResponse::success(['supplier' => $supplier->fresh()]);
    }

    public function destroy(int $id): JsonResponse
    {
        $supplier = SupplierJp::query()->where('deleted_flag', false)->findOrFail($id);
        $supplier->update(['deleted_flag' => true, 'deleted' => now()]);

        return ApiResponse::success(null, 'M0200');
    }
}
