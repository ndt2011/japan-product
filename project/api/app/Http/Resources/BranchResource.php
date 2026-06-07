<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_cd' => $this->branch_cd,
            'branch_name' => $this->branch_name,
            'region' => $this->region,
            'province' => $this->province,
            'address' => $this->address,
            'tel' => $this->tel,
            'disabled_flag' => $this->disabled_flag,
            'users_count' => $this->whenLoaded('users', fn () => $this->users->count()),
            'users' => BranchUserResource::collection($this->whenLoaded('users')),
        ];
    }
}
