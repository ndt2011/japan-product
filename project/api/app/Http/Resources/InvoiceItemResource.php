<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_detail_id' => $this->order_detail_id,
            'product_name' => $this->product_name,
            'quantity' => $this->quantity,
            'unit_price_vnd' => (string) $this->unit_price_vnd,
            'amount' => (string) $this->amount,
        ];
    }
}
