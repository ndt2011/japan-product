<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'movement_type' => $this->movement_type,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->product_name,
            'product_cd' => $this->product?->product_cd,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->warehouse_name,
            'quantity' => (int) $this->quantity,
            'quantity_before' => (int) $this->quantity_before,
            'quantity_after' => (int) $this->quantity_after,
            'ref_type' => $this->ref_type,
            'ref_id' => $this->ref_id,
            'reason' => $this->reason,
            'note' => $this->note,
            'created' => $this->created?->toIso8601String(),
        ];
    }
}
