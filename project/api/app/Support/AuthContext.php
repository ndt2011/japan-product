<?php

namespace App\Support;

use App\Models\CompanyVn;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;

class AuthContext
{
    /**
     * @return array{user: Authenticatable, type: string, id: int}
     */
    public static function from(Request $request): array
    {
        $user = $request->user();
        $type = $user instanceof CompanyVn ? 'company' : 'admin';

        return [
            'user' => $user,
            'type' => $type,
            'id' => (int) $user->id,
        ];
    }
}
