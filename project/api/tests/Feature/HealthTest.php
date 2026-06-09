<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonStructure([
                'data' => [
                    'rakuten_configured',
                    'openai_configured',
                    'queue_connection',
                    'cache_store',
                    'redis_configured',
                    'ai_search_result_limit',
                    'product_image_disk',
                    'r2_configured',
                ],
            ]);
    }

    public function test_health_includes_outbound_ip_when_requested(): void
    {
        \Illuminate\Support\Facades\Cache::forget('health.outbound_ip');

        \Illuminate\Support\Facades\Http::fake([
            'https://api.ipify.org' => \Illuminate\Support\Facades\Http::response('203.0.113.10', 200),
        ]);

        $response = $this->getJson('/api/health?ip=1');

        $response->assertOk()
            ->assertJsonPath('data.outbound_ip', '203.0.113.10')
            ->assertJsonPath('data.outbound_ip_hint', fn ($value) => is_string($value) && $value !== '');
    }
}
