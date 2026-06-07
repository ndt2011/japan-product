<?php

namespace App\Services;

use App\Exceptions\AuthException;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class AdminUserService
{
    public function list(): Collection
    {
        return Admin::query()
            ->where('deleted_flag', false)
            ->orderBy('id')
            ->get();
    }

    public function store(array $data, int $creatorId): Admin
    {
        if (Admin::query()->where('login_id', $data['login_id'])->where('deleted_flag', false)->exists()) {
            throw new AuthException('M0104', 422);
        }

        return Admin::query()->create([
            'login_id' => $data['login_id'],
            'password' => Hash::make($data['password']),
            'full_name' => $data['full_name'],
            'email' => $data['email'] ?? null,
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => $creatorId,
            'deleted_flag' => false,
        ]);
    }

    public function toggle(int $id, int $modifierId): Admin
    {
        $admin = Admin::query()->where('deleted_flag', false)->find($id);

        if (! $admin) {
            throw new AuthException('M0002', 404);
        }

        $admin->update([
            'disabled_flag' => ! $admin->disabled_flag,
            'modified' => now(),
            'modified_user_id' => $modifierId,
        ]);

        return $admin->fresh();
    }
}
