<?php

namespace App\Support;

use App\Models\BranchUser;
use App\Models\CompanyVn;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class AuthContext
{
    /**
     * @return array{user: Authenticatable|null, type: string, id: int}
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
                $tokenableType = (string) $accessToken->tokenable_type;
                if (str_contains($tokenableType, 'CompanyVn')) {
                    $type = 'company';
                } elseif (str_contains($tokenableType, 'BranchUser')) {
                    /** @var BranchUser $user */
                    $type = $user->user_type;
                } else {
                    $type = 'admin';
                }
            }
        } elseif ($user instanceof CompanyVn) {
            $type = 'company';
        } elseif ($user instanceof BranchUser) {
            $type = $user->user_type;
        }

        return [
            'user' => $user,
            'type' => $type,
            'id' => (int) ($user?->id ?? 0),
        ];
    }
}
