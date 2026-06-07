<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $envKeys = array_values(array_filter(
            array_keys($_SERVER),
            static fn (string $k) => str_starts_with($k, 'DB_') || str_starts_with($k, 'MYSQL'),
        ));
        sort($envKeys);

        $dbHost = $_SERVER['DB_HOST'] ?? $_SERVER['MYSQLHOST'] ?? getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: '';

        $payload = [
            'status' => 'ok',
            'service' => 'japan-product-api',
            'timestamp' => now()->toIso8601String(),
            'env' => config('app.env'),
            'db' => config('database.default'),
            'db_host_set' => $dbHost !== '',
            'db_connection_env' => $_SERVER['DB_CONNECTION'] ?? getenv('DB_CONNECTION') ?: null,
            'mysql_env_keys' => $envKeys,
        ];

        return ApiResponse::success($payload);
    }
}
