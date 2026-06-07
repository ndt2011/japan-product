<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class HealthController extends Controller
{
    public function __invoke(Request $request): JsonResponse
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
            'queue_connection' => config('queue.default'),
            'rakuten_configured' => config('services.rakuten.application_id') !== ''
                && config('services.rakuten.access_key') !== '',
            'openai_configured' => config('services.openai.api_key') !== '',
            'ai_search_result_limit' => min(max((int) config('services.ai_search.limit', 15), 1), 10),
        ];

        if ($request->boolean('ip')) {
            $payload['outbound_ip'] = $this->resolveOutboundIp();
            $payload['outbound_ip_hint'] = 'Whitelist this IP on Rakuten Developers (許可IPアドレス). IP may change after Railway redeploy.';
        }

        return ApiResponse::success($payload);
    }

    private function resolveOutboundIp(): ?string
    {
        return Cache::remember('health.outbound_ip', 300, function (): ?string {
            try {
                $response = Http::timeout(5)->get('https://api.ipify.org');

                if (! $response->successful()) {
                    return null;
                }

                $ip = trim($response->body());

                return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : null;
            } catch (\Throwable) {
                return null;
            }
        });
    }
}
