<?php

namespace App\Repositories;

use App\Models\CompanyVn;

class CompanyVnRepository
{
    public function findActiveByLoginId(string $loginId): ?CompanyVn
    {
        return CompanyVn::query()
            ->where('login_id', $loginId)
            ->where('deleted_flag', false)
            ->first();
    }
}
