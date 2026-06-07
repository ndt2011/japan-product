<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'batch_no' => $this->batch_no,
            'batch_name' => $this->batch_name,
            'status' => $this->status,
            'logistics_partner' => $this->logistics_partner,
            'tracking_number' => $this->tracking_number,
            'estimated_departure_date' => $this->estimated_departure_date?->toDateString(),
            'created_admin_name' => $this->creator?->full_name ?? $this->creator?->login_id,
            'orders_count' => $this->whenCounted('items', fn () => $this->items_count),
            'orders' => $this->whenLoaded('items', function () {
                return $this->items->map(fn ($item) => [
                    'id' => $item->order?->id,
                    'order_no' => $item->order?->order_no,
                    'company_name' => $item->order?->company?->company_name,
                    'status' => $item->order?->status,
                    'total_vnd' => $item->order?->total_vnd,
                ]);
            }),
        ];
    }
}
