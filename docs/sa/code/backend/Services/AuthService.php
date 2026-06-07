<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\CompanyVn;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    /**
     * Tìm user qua login_id + password.
     * Thứ tự kiểm tra: admins → companies_vn → branch_users
     *
     * @return Admin|CompanyVn|BranchUser|null
     */
    public function findUser(string $loginId, string $password): Admin|CompanyVn|BranchUser|null
    {
        // 1. Admin
        $admin = Admin::where('login_id', $loginId)
            ->where('deleted_flag', 0)
            ->first();

        if ($admin && Hash::check($password, $admin->password)) {
            return $admin;
        }

        // 2. Company VN
        $company = CompanyVn::where('login_id', $loginId)
            ->where('deleted_flag', 0)
            ->first();

        if ($company && Hash::check($password, $company->password)) {
            return $company;
        }

        // 3. Branch user
        $branchUser = BranchUser::where('login_id', $loginId)
            ->where('deleted_flag', 0)
            ->first();

        if ($branchUser && Hash::check($password, $branchUser->password)) {
            return $branchUser;
        }

        return null;
    }

    /**
     * Tạo Sanctum token và trả về thông tin user.
     *
     * @param Admin|CompanyVn|BranchUser $user
     */
    public function createToken(
        Admin|CompanyVn|BranchUser $user,
        bool $rememberMe = false
    ): array {
        // Xóa token cũ (optional — bỏ nếu muốn multi-device)
        $user->tokens()->delete();

        $expiration = $rememberMe
            ? now()->addDays(30)
            : now()->addHours(24);

        $token = $user->createToken(
            'auth_token',
            ['*'],
            $expiration
        );

        return [
            'token'      => $token->plainTextToken,
            'expires_at' => $expiration->toISOString(),
            'user_type'  => $user->user_type,
            'user'       => $this->formatUser($user),
        ];
    }

    /**
     * Format thông tin user trả về FE (không lộ password).
     */
    private function formatUser(Admin|CompanyVn|BranchUser $user): array
    {
        $base = [
            'id'        => $user->id,
            'user_type' => $user->user_type,
        ];

        return match ($user->user_type) {
            'admin' => array_merge($base, [
                'login_id'  => $user->login_id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
            ]),
            'company_vn' => array_merge($base, [
                'login_id'     => $user->login_id,
                'company_name' => $user->company_name,
                'contact_name' => $user->contact_name,
                'email'        => $user->email,
            ]),
            default => array_merge($base, [   // branch_manager | branch_staff
                'login_id'  => $user->login_id,
                'full_name' => $user->full_name,
                'role'      => $user->role,
                'branch_id' => $user->branch_id,
                'branch'    => $user->branch?->only(['id', 'branch_cd', 'branch_name', 'region']),
            ]),
        };
    }
}
