<?php

namespace App\Services;

use App\Exceptions\AiSearchException;
use App\Jobs\AiProductSearchJob;
use App\Models\AiSearchSession;
use App\Repositories\AiSearchSessionRepository;

class AiSearchService
{
    public function __construct(
        private readonly AiSearchSessionRepository $sessionRepository,
    ) {}

    public function start(string $keyword, string $userType, int $userId): AiSearchSession
    {
        $keyword = trim($keyword);

        if ($keyword === '') {
            throw new AiSearchException('M0001', 422);
        }

        $session = $this->sessionRepository->create([
            'keyword' => $keyword,
            'status' => 'processing',
            'user_type' => $userType,
            'user_id' => $userId,
            'created' => now(),
        ]);

        AiProductSearchJob::dispatch($session->id);

        return $session;
    }

    public function show(int $sessionId, string $userType, int $userId): AiSearchSession
    {
        $session = $this->sessionRepository->find($sessionId);

        if (! $session || $session->user_type !== $userType || (int) $session->user_id !== $userId) {
            throw new AiSearchException('M0002', 404);
        }

        return $session;
    }

    public function resolveMessage(AiSearchSession $session): ?string
    {
        if ($session->status === 'timeout') {
            return 'M0202';
        }

        if ($session->status === 'completed' && empty($session->results_json)) {
            return 'M0201';
        }

        return null;
    }
}
