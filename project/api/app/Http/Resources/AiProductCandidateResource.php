<?php

namespace App\Http\Resources;

use App\Services\ProductPricingService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiProductCandidateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pricing = app(ProductPricingService::class)->buildPricingPreview($this->price_jpy);

        return [
            'id' => $this->id,
            'ai_search_session_id' => $this->ai_search_session_id,
            'product_name_jp' => $this->product_name_jp,
            'product_name_vn' => $this->product_name_vn,
            'image_url' => $this->image_url,
            'price_jpy' => $this->price_jpy,
            'source_url' => $this->source_url,
            'source_platform' => $this->source_platform,
            'description' => $this->description,
            'suggested_category_id' => $this->suggested_category_id,
            'suggested_category_name' => $this->suggested_category_name,
            'usage_instructions' => $this->usage_instructions,
            'spec' => $this->spec,
            'data_source' => $this->data_source,
            'status' => $this->status,
            'reject_reason' => $this->reject_reason,
            'product_id' => $this->product_id,
            'pricing' => $pricing,
            'created' => $this->created?->toIso8601String(),
        ];
    }
}
