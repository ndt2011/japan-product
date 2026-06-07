<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    // GET /warehouses
    public function index(Request $request): JsonResponse
    {
        $warehouses = Warehouse::where('deleted_flag', 0)
            ->when($request->type, fn($q, $type) => $q->where('type', $type))
            ->get(['id', 'warehouse_cd', 'warehouse_name', 'type', 'address']);

        return response()->json(['success' => true, 'data' => $warehouses]);
    }

    // POST /warehouses
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_cd'   => 'required|string|max:20|unique:warehouses,warehouse_cd',
            'warehouse_name' => 'required|string|max:100',
            'type'           => 'required|in:JP,VN',
            'address'        => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $warehouse = Warehouse::create(array_merge($validated, [
            'deleted_flag'    => 0,
            'created'         => now(),
            'created_user_id' => $user->id,
        ]));

        return response()->json(['success' => true, 'data' => $warehouse], 201);
    }

    // GET /warehouses/{id}
    public function show(int $id): JsonResponse
    {
        $warehouse = Warehouse::where('id', $id)
            ->where('deleted_flag', 0)
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $warehouse]);
    }
}
