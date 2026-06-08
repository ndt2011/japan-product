<?php

namespace App\Http\Resources;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() instanceof Admin;

        return [
            'id'                => $this->id,
            'order_detail_id'   => $this->order_detail_id,
            'product_name_jp'   => $this->product_name_jp,
            'product_name_vi'   => $this->product_name_vi,
            'product_sku'       => $this->product_sku,
            'quantity'          => (int) $this->quantity,
            // Giá gốc — chỉ Admin thấy
            'cost_price_jpy'    => $this->when($isAdmin, fn () => (string) $this->cost_price_jpy),
            'selling_price_jpy' => $this->when($isAdmin, fn () => (string) $this->selling_price_jpy),
            // Giá đại lý thấy
            'unit_price_vnd'    => (string) $this->unit_price_vnd,
            'fee_amount_vnd'    => (string) $this->fee_amount_vnd,
            'line_total_vnd'    => (string) $this->line_total_vnd,
        ];
    }
}
