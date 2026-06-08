<?php

namespace App\Jobs;

use App\Repositories\AiSearchSessionRepository;
use App\Services\Ai\AiWebProductSearchService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AiProductSearchJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 90;

    public function __construct(
        public readonly int $sessionId,
    ) {}

    public function handle(
        AiSearchSessionRepository $sessionRepository,
        AiWebProductSearchService $searchService,
    ): void {
        $session = $sessionRepository->find($this->sessionId);

        if (! $session || ! $session->isProcessing()) {
            return;
        }

        try {
            $meta = $searchService->searchWithMeta($session->keyword);
            $results      = $meta['items'];
            $rakutenError = $meta['rakuten_error'];
            $keywordJp    = $meta['keyword_used'] ?? null;

            $sessionRepository->update($session, [
                'status'       => 'completed',
                'keyword_jp'   => $keywordJp,   // lưu keyword JP đã dùng để debug
                'results_json' => $results,
                'error_message' => $rakutenError,
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
