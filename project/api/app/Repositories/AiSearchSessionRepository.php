<?php

namespace App\Repositories;

use App\Models\AiSearchSession;

class AiSearchSessionRepository
{
    public function create(array $data): AiSearchSession
    {
        return AiSearchSession::query()->create($data);
    }

    public function find(int $id): ?AiSearchSession
    {
        return AiSearchSession::query()->find($id);
    }

    public function update(AiSearchSession $session, array $data): AiSearchSession
    {
        $session->update($data);

        return $session->fresh();
    }
}
