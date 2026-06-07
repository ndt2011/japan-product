<?php

namespace App\Repositories;

use App\Models\BranchUser;
use Illuminate\Database\Eloquent\Collection;

class BranchUserRepository
{
    public function findActiveByLoginId(string $loginId): ?BranchUser
    {
        return BranchUser::query()
            ->where('login_id', $loginId)
            ->where('deleted_flag', false)
            ->first();
    }

    public function listByBranch(int $branchId): Collection
    {
        return BranchUser::query()
            ->where('branch_id', $branchId)
            ->where('deleted_flag', false)
            ->orderBy('id')
            ->get();
    }

    public function findInBranch(int $branchId, int $userId): ?BranchUser
    {
        return BranchUser::query()
            ->where('branch_id', $branchId)
            ->where('id', $userId)
            ->where('deleted_flag', false)
            ->first();
    }

    public function create(array $data): BranchUser
    {
        return BranchUser::query()->create($data);
    }

    public function update(BranchUser $user, array $data): BranchUser
    {
        $user->update($data);

        return $user->fresh();
    }
}
