<?php

namespace App\Http\Presenters;

use App\Models\Admin;
use App\Models\BranchUser;
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
                'phone' => $user->phone ?? null,
                'avatar_url' => $user->avatar_url ?? null,
                'branch_id' => $user->branch_id,
                'user_type' => $userType,
            ];
        }

        if ($user instanceof BranchUser) {
            $user->loadMissing('branch');

            return [
                'id' => $user->id,
                'login_id' => $user->login_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'avatar_url' => $user->avatar_url ?? null,
                'user_type' => $userType,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'branch' => $user->branch ? [
                    'id' => $user->branch->id,
                    'branch_cd' => $user->branch->branch_cd,
                    'branch_name' => $user->branch->branch_name,
                    'region' => $user->branch->region,
                    'province' => $user->branch->province,
                ] : null,
            ];
        }

        /** @var CompanyVn $user */
        return [
            'id' => $user->id,
            'login_id' => $user->login_id,
            'company_name' => $user->company_name,
            'company_cd' => $user->company_cd,
            'email' => $user->email,
            'phone' => $user->phone ?? null,
            'avatar_url' => $user->avatar_url ?? null,
            'contact_name' => $user->contact_name,
            'user_type' => $userType,
        ];
    }
}
