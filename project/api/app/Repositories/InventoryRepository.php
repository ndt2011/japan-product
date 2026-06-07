<?php

namespace App\Repositories;

use App\Models\Inventory;

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
