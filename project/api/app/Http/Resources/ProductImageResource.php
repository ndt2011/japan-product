<?php

namespace App\Http\Resources;

use App\Services\ImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imageUrl = app(ImageStorageService::class)->publicUrl($this->image_path);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'image_path' => $imageUrl,
            'is_primary' => $this->is_primary,
            'order_no' => $this->order_no,
        ];
    }
}
