<?php

namespace App\Services;

use App\Models\ExchangeRate;

class ExchangeRateService
{
    public function currentJpyToVnd(): float
    {
        $rate = ExchangeRate::query()
            ->where('from_currency', 'JPY')
            ->where('to_currency', 'VND')
            ->where('deleted_flag', false)
            ->whereDate('apply_date', '<=', now()->toDateString())
            ->orderByDesc('apply_date')
            ->value('rate');

        return (float) ($rate ?? 170.5);
    }
}
