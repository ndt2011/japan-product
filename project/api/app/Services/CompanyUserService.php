<?php

namespace App\Services;

use App\Exceptions\AuthException;
use App\Models\CompanyVn;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class CompanyUserService
{
    public function list(): Collection
    {
        return CompanyVn::query()
            ->where('deleted_flag', false)
            ->orderBy('id')
            ->get();
    }

    public function store(array $data, int $creatorId): CompanyVn
    {
        if (CompanyVn::query()->where('login_id', $data['login_id'])->where('deleted_flag', false)->exists()) {
            throw new AuthException('M0104', 422);
        }

        if (! empty($data['company_cd']) && CompanyVn::query()->where('company_cd', $data['company_cd'])->where('deleted_flag', false)->exists()) {
            throw new AuthException('M0105', 422);
        }

        return CompanyVn::query()->create([
            'login_id' => $data['login_id'],
            'password' => Hash::make($data['password']),
            'company_cd' => $data['company_cd'] ?? null,
            'company_name' => $data['company_name'],
            'contact_name' => $data['contact_name'] ?? null,
            'email' => $data['email'] ?? null,
            'tel' => $data['tel'] ?? null,
            'province' => $data['province'] ?? null,
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => $creatorId,
            'deleted_flag' => false,
        ]);
    }

    public function toggle(int $id, int $modifierId): CompanyVn
    {
        $company = CompanyVn::query()->where('deleted_flag', false)->find($id);

        if (! $company) {
            throw new AuthException('M0002', 404);
        }

        $company->update([
            'disabled_flag' => ! $company->disabled_flag,
            'modified' => now(),
            'modified_user_id' => $modifierId,
        ]);

        return $company->fresh();
    }
}
