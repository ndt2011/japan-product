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
        ];

        if (in_array(config('app.env'), ['staging', 'local'], true)) {
            $payload['db'] = config('database.default');
        }

        return ApiResponse::success($payload);
    }
}
