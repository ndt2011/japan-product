<?php

namespace Tests\Feature;

use App\Services\Ai\AiWebProductSearchService;
use App\Services\Ai\RakutenIchibaSearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RakutenIchibaSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_rakuten_search_returns_normalized_items(): void
    {
        config([
            'services.rakuten.application_id' => 'test-app-id',
            'services.rakuten.access_key' => 'test-access-key',
        ]);

        Http::fake([
            'openapi.rakuten.co.jp/*' => Http::response([
                'Items' => [
                    [
                        'itemName' => 'DHC コラーゲン 60日分',
                        'itemCode' => 'shop:123456',
                        'itemPrice' => 2980,
                        'itemUrl' => 'https://item.rakuten.co.jp/example/item/',
                        'itemCaption' => 'コラーゲンサプリ',
                        'mediumImageUrls' => [
                            ['imageUrl' => 'https://thumbnail.image.rakuten.co.jp/example.jpg'],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $service = app(RakutenIchibaSearchService::class);
        $results = $service->search('コラーゲン', 5);

        $this->assertCount(1, $results);
        $this->assertSame('rakuten-shop:123456', $results[0]['external_id']);
        $this->assertSame('DHC コラーゲン 60日分', $results[0]['product_name_jp']);
        $this->assertSame(2980, $results[0]['price_jpy']);
        $this->assertSame('rakuten', $results[0]['source_platform']);
        $this->assertSame('rakuten_api', $results[0]['data_source']);
    }

    public function test_web_search_prefers_rakuten_over_openai(): void
    {
        config([
            'services.rakuten.application_id' => 'test-app-id',
            'services.rakuten.access_key' => 'test-access-key',
            'services.openai.api_key' => 'openai-key',
        ]);

        Http::fake([
            'openapi.rakuten.co.jp/*' => Http::response([
                'Items' => [
                    [
                        'itemName' => 'Rakuten Product',
                        'itemCode' => 'shop:1',
                        'itemPrice' => 1000,
                        'itemUrl' => 'https://item.rakuten.co.jp/example/',
                    ],
                ],
            ], 200),
            'api.openai.com/*' => Http::response([], 500),
        ]);

        $meta = app(AiWebProductSearchService::class)->searchWithMeta('test');

        $this->assertCount(1, $meta['items']);
        $this->assertSame('rakuten_api', $meta['items'][0]['data_source']);
        $this->assertNull($meta['rakuten_error']);
    }

    public function test_when_rakuten_configured_and_fails_no_openai_fallback(): void
    {
        config([
            'services.rakuten.application_id' => 'test-app-id',
            'services.rakuten.access_key' => 'test-access-key',
            'services.openai.api_key' => 'openai-key',
        ]);

        Http::fake([
            'openapi.rakuten.co.jp/*' => Http::response([
                'errors' => ['errorMessage' => 'CLIENT_IP_NOT_ALLOWED'],
            ], 403),
            'api.openai.com/*' => Http::response([], 500),
        ]);

        $meta = app(AiWebProductSearchService::class)->searchWithMeta('test');

        $this->assertSame([], $meta['items']);
        $this->assertSame('CLIENT_IP_NOT_ALLOWED', $meta['rakuten_error']);
    }
}
