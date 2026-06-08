<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'data_type' => $this->data_type,
            'data_id' => $this->data_id,
            'is_read' => (bool) $this->is_read,
            'created' => $this->created?->toIso8601String(),
        ];
    }
}
