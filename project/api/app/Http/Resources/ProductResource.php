<?php

namespace App\Http\Resources;

use App\Services\ImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $inventoryTotal = $this->whenLoaded('inventories', function () {
            return (int) $this->inventories->sum('quantity');
        });

        return [
            'id' => $this->id,
            'product_category_id' => $this->product_category_id,
            'category_name' => $this->category?->category_name,
            'product_cd' => $this->product_cd,
            'product_name' => $this->product_name,
            'product_name_jp' => $this->product_name_jp,
            'name_vi' => $this->name_vi,
            'spec' => $this->spec,
            'unit' => $this->unit,
            'cost_jpy' => $this->cost_jpy,
            'price_vnd' => $this->price_vnd,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier?->supplier_name,
            'origin' => $this->origin,
            'import_tax_rate' => $this->import_tax_rate,
            'description' => $this->description,
            'description_vi' => $this->description_vi,
            'image_path' => $this->image_path
                ? app(ImageStorageService::class)->publicUrl($this->image_path)
                : null,
            'images' => $this->whenLoaded('images', function () {
                return ProductImageResource::collection($this->images);
            }),
            'memo' => $this->memo,
            'disabled_flag' => $this->disabled_flag,
            'inventory_total' => $inventoryTotal,
        ];
    }
}
