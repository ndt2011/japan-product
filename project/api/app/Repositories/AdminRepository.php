<?php

namespace App\Repositories;

use App\Models\Admin;

class AdminRepository
{
    public function findActiveByLoginId(string $loginId): ?Admin
    {
        return Admin::query()
            ->where('login_id', $loginId)
            ->where('deleted_flag', false)
            ->first();
    }
}
