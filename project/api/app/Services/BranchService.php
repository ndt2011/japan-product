<?php

namespace App\Services;

use App\Exceptions\BranchException;
use App\Models\Branch;
use App\Repositories\BranchRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BranchService
{
    public function __construct(
        private readonly BranchRepository $branchRepository,
    ) {}

    public function list(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $this->branchRepository->paginate($filters, $perPage);
    }

    public function show(int $id): Branch
    {
        $branch = $this->branchRepository->findActive($id);

        if (! $branch) {
            throw new BranchException('M1201', 404);
        }

        return $branch;
    }

    public function store(array $data, int $adminId): Branch
    {
        if ($this->branchRepository->findByCd($data['branch_cd'])) {
            throw new BranchException('M0001', 422);
        }

        return $this->branchRepository->create([
            'branch_cd' => $data['branch_cd'],
            'branch_name' => $data['branch_name'],
            'region' => $data['region'],
            'province' => $data['province'],
            'address' => $data['address'] ?? null,
            'tel' => $data['tel'] ?? null,
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => $adminId,
            'deleted_flag' => false,
        ]);
    }

    public function update(int $id, array $data, int $adminId): Branch
    {
        $branch = $this->show($id);

        return $this->branchRepository->update($branch, [
            'branch_name' => $data['branch_name'] ?? $branch->branch_name,
            'region' => $data['region'] ?? $branch->region,
            'province' => $data['province'] ?? $branch->province,
            'address' => array_key_exists('address', $data) ? $data['address'] : $branch->address,
            'tel' => array_key_exists('tel', $data) ? $data['tel'] : $branch->tel,
            'modified' => now(),
            'modified_user_id' => $adminId,
        ]);
    }

    public function toggle(int $id, int $adminId): Branch
    {
        $branch = $this->show($id);

        return $this->branchRepository->update($branch, [
            'disabled_flag' => ! $branch->disabled_flag,
            'modified' => now(),
            'modified_user_id' => $adminId,
        ]);
    }
}
