<?php

namespace App\Repositories;

use App\Models\Inventory;
use App\Models\Warehouse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class WarehouseRepository
{
    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Warehouse::query()
            ->where('deleted_flag', false)
            ->orderBy('warehouse_name');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('warehouse_name', 'like', "%{$search}%")
                    ->orWhere('warehouse_cd', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        return $query->paginate($perPage);
    }

    public function find(int $id): ?Warehouse
    {
        return Warehouse::query()
            ->where('deleted_flag', false)
            ->find($id);
    }

    public function create(array $data): Warehouse
    {
        return Warehouse::query()->create($data);
    }

    public function update(Warehouse $warehouse, array $data): Warehouse
    {
        $warehouse->update($data);

        return $warehouse->fresh();
    }

    public function statsForWarehouse(int $warehouseId): array
    {
        $rows = Inventory::query()
            ->active()
            ->where('warehouse_id', $warehouseId)
            ->get(['product_id', 'quantity']);

        return [
            'total_products' => $rows->count(),
            'total_quantity' => (int) $rows->sum('quantity'),
        ];
    }

    public function allActive(): Collection
    {
        return Warehouse::query()
            ->where('deleted_flag', false)
            ->where('disabled_flag', false)
            ->orderBy('warehouse_name')
            ->get();
    }

    public function defaultWarehouse(): ?Warehouse
    {
        return Warehouse::query()
            ->where('deleted_flag', false)
            ->where('disabled_flag', false)
            ->orderBy('id')
            ->first();
    }
}
