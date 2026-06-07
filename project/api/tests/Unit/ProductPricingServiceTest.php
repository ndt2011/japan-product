<?php

namespace Tests\Unit;

use App\Models\ExchangeRate;
use App\Services\ProductPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductPricingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_calculates_vnd_with_markup(): void
    {
        ExchangeRate::query()->create([
            'from_currency' => 'JPY',
            'to_currency' => 'VND',
            'rate' => 170,
            'apply_date' => now()->toDateString(),
            'deleted_flag' => false,
            'created' => now(),
        ]);

        config(['services.product.markup_percent' => 30]);

        $service = app(ProductPricingService::class);

        $this->assertSame(170.0, app(\App\Services\ExchangeRateService::class)->currentJpyToVnd());
        $this->assertSame(221000, $service->calculateSellingPriceVnd(1000));
    }

    public function test_keeps_null_for_missing_jpy(): void
    {
        $service = app(ProductPricingService::class);

        $this->assertNull($service->calculateSellingPriceVnd(null));
    }
}
