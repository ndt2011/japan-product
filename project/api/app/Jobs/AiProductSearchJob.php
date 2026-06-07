<?php

namespace App\Jobs;

use App\Repositories\AiSearchSessionRepository;
use App\Services\Ai\OpenAiProductSearchService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AiProductSearchJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 30;

    public function __construct(
        public readonly int $sessionId,
    ) {}

    public function handle(
        AiSearchSessionRepository $sessionRepository,
        OpenAiProductSearchService $searchService,
    ): void {
        $session = $sessionRepository->find($this->sessionId);

        if (! $session || ! $session->isProcessing()) {
            return;
        }

        try {
            $results = $searchService->search($session->keyword);

            $sessionRepository->update($session, [
                'status' => 'completed',
                'results_json' => $results,
                'completed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('AI search job failed', [
                'session_id' => $this->sessionId,
                'error' => $e->getMessage(),
            ]);

            $sessionRepository->update($session, [
                'status' => str_contains(strtolower($e->getMessage()), 'timeout') ? 'timeout' : 'failed',
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);
        }
    }
}
