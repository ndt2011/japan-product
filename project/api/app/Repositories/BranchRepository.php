<?php

namespace App\Repositories;

use App\Models\Branch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class BranchRepository
{
    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findActive(int $id): ?Branch
    {
        return Branch::query()->active()->with('users')->find($id);
    }

    public function findByCd(string $branchCd): ?Branch
    {
        return Branch::query()
            ->active()
            ->where('branch_cd', $branchCd)
            ->first();
    }

    public function create(array $data): Branch
    {
        return Branch::query()->create($data);
    }

    public function update(Branch $branch, array $data): Branch
    {
        $branch->update($data);

        return $branch->fresh(['users']);
    }

    private function baseQuery(array $filters): Builder
    {
        $query = Branch::query()->active();

        if (! empty($filters['region'])) {
            $query->where('region', $filters['region']);
        }

        if (! empty($filters['province'])) {
            $query->where('province', $filters['province']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('branch_cd', 'like', "%{$search}%")
                    ->orWhere('branch_name', 'like', "%{$search}%");
            });
        }

        return $query;
    }
}
