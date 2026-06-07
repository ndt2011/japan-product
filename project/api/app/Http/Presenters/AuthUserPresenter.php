<?php

namespace App\Http\Presenters;

use App\Models\Admin;
use App\Models\CompanyVn;
use Illuminate\Contracts\Auth\Authenticatable;

class AuthUserPresenter
{
    public static function present(Authenticatable $user, string $userType): array
    {
        if ($user instanceof Admin) {
            return [
                'id' => $user->id,
                'login_id' => $user->login_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'branch_id' => $user->branch_id,
                'user_type' => $userType,
            ];
        }

        /** @var CompanyVn $user */
        return [
            'id' => $user->id,
            'login_id' => $user->login_id,
            'company_name' => $user->company_name,
            'company_cd' => $user->company_cd,
            'email' => $user->email,
            'contact_name' => $user->contact_name,
            'user_type' => $userType,
        ];
    }
}
