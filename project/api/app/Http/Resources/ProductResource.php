<?php

namespace App\Http\Resources;

use App\Services\ImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() instanceof \App\Models\Admin;

        // available_qty: từ subquery (list) hoặc tính lại từ eager loaded inventories (show)
        $availableQty = isset($this->resource->available_qty)
            ? (int) $this->resource->available_qty
            : $this->whenLoaded('inventories', function () {
                return (int) $this->inventories->sum(fn ($inv) => $inv->quantity - $inv->reserved_qty);
            }, 0);

        // stock_status: computed từ available_qty
        // spec: docs/sa/amendments/product-tier-model.md § 2
        $stockStatus = match (true) {
            $availableQty >= 10 => 'IN_STOCK',
            $availableQty > 0   => 'LOW_STOCK',
            default             => 'OUT_OF_STOCK',
        };

        // primary_image_url: từ subquery (list) hoặc images relation (show)
        $primaryImageUrl = isset($this->resource->primary_image_url)
            ? ($this->resource->primary_image_url
                ? app(ImageStorageService::class)->publicUrl($this->resource->primary_image_url)
                : null)
            : $this->whenLoaded('images', function () {
                $primary = $this->images->firstWhere('is_primary', true) ?? $this->images->first();

                return $primary
                    ? app(ImageStorageService::class)->publicUrl($primary->image_path)
                    : null;
            });

        return [
            'id'                  => $this->id,
            'product_category_id' => $this->product_category_id,
            'category_name'       => $this->category?->category_name,
            'product_cd'          => $this->product_cd,
            'product_name'        => $this->product_name,
            'product_name_jp'     => $this->product_name_jp,
            'name_vi'             => $this->name_vi,
            'spec'                => $this->spec,
            'unit'                => $this->unit,
            'cost_jpy'            => $this->cost_jpy,
            'cost_price_jpy'      => $this->when($isAdmin, $this->cost_price_jpy ?? $this->cost_jpy),
            'selling_price_jpy'   => $this->when($isAdmin, $this->selling_price_jpy ?? $this->cost_jpy),
            'fee_rate'            => $this->fee_rate ?? 0.05,
            'price_vnd'           => $this->price_vnd,
            'supplier_id'         => $this->supplier_id,
            'supplier_name'       => $this->supplier?->supplier_name,
            'origin'              => $this->origin,
            'import_tax_rate'     => $this->import_tax_rate,
            'description'         => $this->description,
            'description_vi'      => $this->description_vi,
            // Ảnh chính (URL đầy đủ)
            'primary_image_url'   => $primaryImageUrl,
            // Legacy — giữ lại tương thích ngược
            'image_path'          => $this->image_path
                ? app(ImageStorageService::class)->publicUrl($this->image_path)
                : null,
            'images'              => $this->whenLoaded('images', function () {
                return ProductImageResource::collection($this->images);
            }),
            'memo'                => $this->memo,
            'disabled_flag'       => $this->disabled_flag,
            // Tồn kho — spec: docs/sa/amendments/product-tier-model.md § 3
            'available_qty'       => $availableQty,
            'stock_status'        => $stockStatus,
            // Legacy aggregate (giữ tương thích ngược với admin dashboard)
            'inventory_total'     => $this->whenLoaded('inventories', function () {
                return (int) $this->inventories->sum('quantity');
            }),
        ];
    }
}
