<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiProductCandidateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
            'status' => $this->status,
            'reject_reason' => $this->reject_reason,
            'product_id' => $this->product_id,
            'created' => $this->created?->toIso8601String(),
        ];
    }
}
