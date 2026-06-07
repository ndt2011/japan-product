<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $payload = [
            'status' => 'ok',
            'service' => 'japan-product-api',
            'timestamp' => now()->toIso8601String(),
            'env' => config('app.env'),
            'db' => config('database.default'),
            'db_host_set' => (bool) (env('DB_HOST') ?: env('MYSQLHOST')),
        ];

        return ApiResponse::success($payload);
    }
}
