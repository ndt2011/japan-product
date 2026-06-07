<?php

namespace App\Services;

class ProductPricingService
{
    public function __construct(
        private readonly ExchangeRateService $exchangeRateService,
    ) {}

    public function markupMultiplier(): float
    {
        $percent = (float) config('services.product.markup_percent', 30);

        return 1 + ($percent / 100);
    }

    public function calculateSellingPriceVnd(?int $costJpy, ?float $exchangeRate = null): ?int
    {
        if ($costJpy === null || $costJpy <= 0) {
            return null;
        }

        $rate = $exchangeRate ?? $this->exchangeRateService->currentJpyToVnd();
        $vnd = $costJpy * $rate * $this->markupMultiplier();

        return (int) round($vnd, -2);
    }

    /**
     * @return array{exchange_rate: float, markup_percent: float, cost_jpy: int, price_vnd: int|null}
     */
    public function buildPricingPreview(?int $costJpy): array
    {
        $rate = $this->exchangeRateService->currentJpyToVnd();
        $markupPercent = (float) config('services.product.markup_percent', 30);

        return [
            'exchange_rate' => $rate,
            'markup_percent' => $markupPercent,
            'cost_jpy' => $costJpy ?? 0,
            'price_vnd' => $this->calculateSellingPriceVnd($costJpy, $rate),
        ];
    }
}
