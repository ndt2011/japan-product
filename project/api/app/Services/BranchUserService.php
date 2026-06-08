<?php

namespace App\Services;

use App\Exceptions\BranchException;
use App\Models\BranchUser;
use App\Repositories\BranchRepository;
use App\Repositories\BranchUserRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class BranchUserService
{
    public function __construct(
        private readonly BranchRepository $branchRepository,
        private readonly BranchUserRepository $branchUserRepository,
    ) {}

    public function list(int $branchId, BranchUser|int $authUser, string $authType): Collection
    {
        $this->assertCanManageBranch($branchId, $authUser, $authType);

        return $this->branchUserRepository->listByBranch($branchId);
    }

    public function store(int $branchId, array $data, BranchUser|int $authUser, string $authType): BranchUser
    {
        $this->assertCanManageBranch($branchId, $authUser, $authType);

        if ($authType === 'branch_manager' && ($data['role'] ?? 'staff') !== 'staff') {
            throw new BranchException('M1203', 403);
        }

        $creatorId = is_int($authUser) ? $authUser : $authUser->id;

        return $this->branchUserRepository->create([
            'branch_id' => $branchId,
            'login_id' => $data['login_id'],
            'password' => Hash::make($data['password']),
            'full_name' => $data['full_name'],
            'email' => $data['email'] ?? null,
            'role' => $data['role'],
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => $creatorId,
            'deleted_flag' => false,
        ]);
    }

    public function update(int $branchId, int $userId, array $data, BranchUser|int $authUser, string $authType): BranchUser
    {
        $this->assertCanManageBranch($branchId, $authUser, $authType);

        $user = $this->branchUserRepository->findInBranch($branchId, $userId);

        if (! $user) {
            throw new BranchException('M1201', 404);
        }

        if ($authType === 'branch_manager' && isset($data['role']) && $data['role'] !== 'staff') {
            throw new BranchException('M1203', 403);
        }

        $modifierId = is_int($authUser) ? $authUser : $authUser->id;
        $payload = [
            'full_name' => $data['full_name'] ?? $user->full_name,
            'email' => array_key_exists('email', $data) ? $data['email'] : $user->email,
            'modified' => now(),
            'modified_user_id' => $modifierId,
        ];

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        if (! empty($data['role']) && $authType === 'admin') {
            $payload['role'] = $data['role'];
        }

        return $this->branchUserRepository->update($user, $payload);
    }

    public function toggle(int $branchId, int $userId, BranchUser|int $authUser, string $authType): BranchUser
    {
        $this->assertCanManageBranch($branchId, $authUser, $authType);

        $user = $this->branchUserRepository->findInBranch($branchId, $userId);

        if (! $user) {
            throw new BranchException('M1201', 404);
        }

        $modifierId = is_int($authUser) ? $authUser : $authUser->id;

        return $this->branchUserRepository->update($user, [
            'disabled_flag' => ! $user->disabled_flag,
            'modified' => now(),
            'modified_user_id' => $modifierId,
        ]);
    }

    private function assertCanManageBranch(int $branchId, BranchUser|int $authUser, string $authType): void
    {
        if ($authType === 'admin') {
            if (! $this->branchRepository->findActive($branchId)) {
                throw new BranchException('M1201', 404);
            }

            return;
        }

        if ($authType === 'branch_manager') {
            if (! $authUser instanceof BranchUser || (int) $authUser->branch_id !== $branchId) {
                throw new BranchException('M1204', 403);
            }

            return;
        }

        throw new BranchException('M0403', 403);
    }
}
