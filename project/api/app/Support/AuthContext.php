<?php

namespace App\Support;

use App\Models\CompanyVn;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class AuthContext
{
    /**
     * @return array{user: Authenticatable, type: string, id: int}
     */
    public static function from(Request $request): array
    {
        $user = $request->user();
        $type = 'admin';

        $bearer = $request->bearerToken();
        if ($bearer) {
            $accessToken = PersonalAccessToken::findToken($bearer);
            if ($accessToken?->tokenable) {
                $user = $accessToken->tokenable;
                $type = str_contains((string) $accessToken->tokenable_type, 'CompanyVn')
                    ? 'company'
                    : 'admin';
            }
        } elseif ($user instanceof CompanyVn) {
            $type = 'company';
        }

        return [
            'user' => $user,
            'type' => $type,
            'id' => (int) $user->id,
        ];
    }
}
