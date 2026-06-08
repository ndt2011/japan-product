<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_no' => $this->order_no,
            'company_vn_id' => $this->company_vn_id,
            'company_name' => $this->company?->company_name,
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch?->branch_name,
            'status' => $this->status,
            'order_date' => $this->order_date?->toDateString(),
            'expected_date' => $this->expected_date?->toDateString(),
            'total_jpy' => $this->total_jpy,
            'total_vnd' => $this->total_vnd,
            'exchange_rate' => $this->exchange_rate,
            'biko' => $this->biko,
            'payment_method' => $this->payment_method,
            'payment_at' => $this->payment_at?->toIso8601String(),
            'payment_ref' => $this->payment_ref,
            'payment_note' => $this->payment_note,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'tracking_no' => $this->tracking_no,
            'carrier_name' => $this->carrier_name,
            'handler_name' => $this->handler?->full_name ?? $this->handler?->login_id,
            'items_count' => $this->whenLoaded('details', fn () => $this->details->count()),
            'details' => OrderDetailResource::collection($this->whenLoaded('details')),
        ];
    }
}
