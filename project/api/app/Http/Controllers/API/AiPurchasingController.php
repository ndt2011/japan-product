<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
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
    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query'       => ['required', 'string', 'max:500'],
            'budget_jpy'  => ['nullable', 'integer', 'min:1'],
            'qty'         => ['nullable', 'integer', 'min:1', 'max:10000'],
            'preferences' => ['nullable', 'string', 'max:500'],
        ]);

        $auth = AuthContext::from($request);

        try {
            $result = $this->purchasingService->analyze($validated, $auth['user']);
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
}
