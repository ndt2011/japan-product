<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $available = max(0, (int) $this->quantity - (int) $this->reserved_qty);

        $minStock = (int) ($this->min_stock_qty ?? 5);

        return [
            'id' => $this->id,
            'inventory_cd' => $this->inventory_cd,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->product_name,
            'product_cd' => $this->product?->product_cd,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->warehouse_name,
            'quantity' => (int) $this->quantity,
            'reserved_qty' => (int) $this->reserved_qty,
            'available_qty' => $available,
            'actual_qty' => (int) $this->actual_qty,
            'last_check_date' => $this->last_check_date?->format('Y-m-d'),
            'is_low_stock' => $available < $minStock,
            'restock_status' => $this->restock_status ?? 'NORMAL',
            'restock_eta' => $this->restock_eta?->format('Y-m-d'),
            'min_stock_qty' => $minStock,
            'notes' => $this->notes,
        ];
    }
}
