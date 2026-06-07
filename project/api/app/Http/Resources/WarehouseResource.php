<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warehouse_cd' => $this->warehouse_cd,
            'warehouse_name' => $this->warehouse_name,
            'address' => $this->address,
            'country' => $this->country,
            'manager_name' => $this->manager_name,
            'tel' => $this->tel,
            'disabled_flag' => (bool) $this->disabled_flag,
            'total_products' => $this->total_products ?? null,
            'total_quantity' => $this->total_quantity ?? null,
        ];
    }
}
