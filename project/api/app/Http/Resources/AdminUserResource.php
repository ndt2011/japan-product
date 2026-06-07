<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'login_id' => $this->login_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'user_type' => 'admin',
            'disabled_flag' => $this->disabled_flag,
        ];
    }
}
