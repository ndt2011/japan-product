<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_no' => $this->order?->order_no,
            'company_vn_id' => $this->company_vn_id,
            'company_name' => $this->company?->company_name,
            'invoice_no' => $this->invoice_no,
            'invoice_date' => $this->invoice_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'amount_vnd' => (string) $this->amount_vnd,
            'tax_amount' => (string) $this->tax_amount,
            'total_amount' => (string) $this->total_amount,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'paid_amount' => $this->paid_amount !== null ? (string) $this->paid_amount : null,
            'payment_method' => $this->payment_method,
            'note' => $this->note,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
