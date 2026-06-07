<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'login_id' => $this->login_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'role' => $this->role,
            'user_type' => $this->user_type,
            'disabled_flag' => $this->disabled_flag,
        ];
    }
}
