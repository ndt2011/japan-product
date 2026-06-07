<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->product_name,
            'product_cd' => $this->product?->product_cd,
            'quantity' => $this->quantity,
            'unit_price_jpy' => $this->unit_price_jpy,
            'unit_price_vnd' => $this->unit_price_vnd,
            'subtotal_vnd' => $this->subtotal_vnd,
            'comment' => $this->comment,
        ];
    }
}
