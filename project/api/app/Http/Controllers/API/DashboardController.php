<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function stats(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        return ApiResponse::success(
            $this->dashboardService->stats($auth['user'], $auth['type']),
        );
    }

    public function orderChart(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $days = min(max((int) $request->query('period', 30), 7), 90);

        return ApiResponse::success([
            'period_days' => $days,
            'points' => $this->dashboardService->orderChart($auth['user'], $auth['type'], $days),
        ]);
    }
}
