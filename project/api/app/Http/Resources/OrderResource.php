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
            'status' => $this->status,
            'order_date' => $this->order_date?->toDateString(),
            'expected_date' => $this->expected_date?->toDateString(),
            'total_jpy' => $this->total_jpy,
            'total_vnd' => $this->total_vnd,
            'exchange_rate' => $this->exchange_rate,
            'biko' => $this->biko,
            'handler_name' => $this->handler?->full_name ?? $this->handler?->login_id,
            'items_count' => $this->whenLoaded('details', fn () => $this->details->count()),
            'details' => OrderDetailResource::collection($this->whenLoaded('details')),
        ];
    }
}
