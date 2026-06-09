<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ai\AnalyzePurchasingRequest;
use App\Services\Ai\AiPurchasingService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AI Purchasing Specialist
 * spec: docs/sa/amendments/ai-purchasing-specialist.md
 */
class AiPurchasingController extends Controller
{
    public function __construct(
        private readonly AiPurchasingService $purchasingService,
    ) {}

    /**
     * POST /ai/purchasing
     * Body: { query, budget_jpy?, qty?, preferences? }
     */
    public function analyze(AnalyzePurchasingRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $auth = AuthContext::from($request);

        try {
            $result = $this->purchasingService->analyze(
                $validated,
                $auth['user'],
                $auth['type'],
                $auth['id'],
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('AiPurchasingController::analyze failed', [
                'error' => $e->getMessage(),
                'query' => $validated['query'],
            ]);

            return ApiResponse::error('M0001', null, 500);
        }

        if (! ($result['success'] ?? false)) {
            return ApiResponse::error('M0002', $result['message'] ?? null, 404);
        }

        return ApiResponse::success($result, 'M0200');
    }

    /**
     * GET /ai/purchasing/history
     */
    public function history(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));

        $paginator = $this->purchasingService->listHistory($auth['type'], $auth['id'], $perPage);

        return ApiResponse::success([
            'items' => collect($paginator->items())->map(fn ($s) => [
                'id' => $s->id,
                'query' => $s->query,
                'keyword_jp' => $s->keyword_jp,
                'budget_jpy' => $s->budget_jpy,
                'qty' => $s->qty,
                'status' => $s->status,
                'result_count' => count($s->response_json['results'] ?? []),
                'top_score' => $s->response_json['recommendation']['total_score'] ?? null,
                'created' => $s->created?->toIso8601String(),
            ]),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * GET /ai/purchasing/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);
        $session = $this->purchasingService->getSession($id, $auth['type'], $auth['id']);

        if (! $session) {
            return ApiResponse::error('M0002', null, 404);
        }

        return ApiResponse::success([
            'session' => [
                'id' => $session->id,
                'query' => $session->query,
                'keyword_jp' => $session->keyword_jp,
                'budget_jpy' => $session->budget_jpy,
                'qty' => $session->qty,
                'status' => $session->status,
                'created' => $session->created?->toIso8601String(),
            ],
            ...($session->response_json ?? []),
        ]);
    }
}
