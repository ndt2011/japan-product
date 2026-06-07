<?php

namespace App\Repositories;

use App\Models\Inventory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InventoryRepository
{
    public function findByProduct(int $productId): ?Inventory
    {
        return Inventory::query()
            ->active()
            ->where('product_id', $productId)
            ->orderByDesc('quantity')
            ->first();
    }

    public function findForWarehouse(int $productId, int $warehouseId): ?Inventory
    {
        return Inventory::query()
            ->active()
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();
    }

    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Inventory::query()
            ->with(['product.category', 'product.supplier', 'warehouse'])
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->where('inventories.deleted_flag', false)
            ->where('products.deleted_flag', false)
            ->select('inventories.*')
            ->orderByDesc('inventories.quantity');

        if (! empty($filters['warehouse_id'])) {
            $query->where('inventories.warehouse_id', (int) $filters['warehouse_id']);
        }

        if (! empty($filters['product_id'])) {
            $query->where('inventories.product_id', (int) $filters['product_id']);
        }

        if (! empty($filters['low_stock'])) {
            $query->whereRaw('(inventories.quantity - inventories.reserved_qty) < 10');
        }

        return $query->paginate($perPage);
    }

    public function firstOrCreate(int $productId, int $warehouseId, int $userId): Inventory
    {
        return Inventory::query()->firstOrCreate(
            ['product_id' => $productId, 'warehouse_id' => $warehouseId, 'deleted_flag' => false],
            [
                'quantity' => 0,
                'reserved_qty' => 0,
                'actual_qty' => 0,
                'created' => now(),
                'created_user_id' => $userId,
            ],
        );
    }

    public function reserve(Inventory $inventory, int $qty): Inventory
    {
        $inventory->update([
            'reserved_qty' => (int) $inventory->reserved_qty + $qty,
            'modified' => now(),
        ]);

        return $inventory->fresh();
    }

    public function release(Inventory $inventory, int $qty): Inventory
    {
        $inventory->update([
            'reserved_qty' => max(0, (int) $inventory->reserved_qty - $qty),
            'modified' => now(),
        ]);

        return $inventory->fresh();
    }
}
