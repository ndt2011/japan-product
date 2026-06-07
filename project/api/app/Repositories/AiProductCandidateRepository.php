<?php

namespace App\Repositories;

use App\Models\AiProductCandidate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AiProductCandidateRepository
{
    public function paginateByStatus(?string $status, int $perPage = 20): LengthAwarePaginator
    {
        $query = AiProductCandidate::query()
            ->active()
            ->orderByDesc('id');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    public function find(int $id): ?AiProductCandidate
    {
        return AiProductCandidate::query()->active()->find($id);
    }

    public function create(array $data): AiProductCandidate
    {
        return AiProductCandidate::query()->create($data);
    }

    public function createMany(array $rows): Collection
    {
        $created = collect();

        foreach ($rows as $row) {
            $created->push($this->create($row));
        }

        return $created;
    }

    public function update(AiProductCandidate $candidate, array $data): AiProductCandidate
    {
        $candidate->update($data);

        return $candidate->fresh();
    }
}
