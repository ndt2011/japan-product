<?php

namespace Database\Seeders;

use App\Models\ExchangeRate;
use Illuminate\Database\Seeder;

class ExchangeRateSeeder extends Seeder
{
    public function run(): void
    {
        ExchangeRate::query()->updateOrCreate(
            [
                'from_currency' => 'JPY',
                'to_currency' => 'VND',
                'apply_date' => now()->toDateString(),
            ],
            [
                'rate' => 170.5,
                'source' => 'manual',
                'deleted_flag' => false,
                'created' => now(),
            ],
        );
    }
}
