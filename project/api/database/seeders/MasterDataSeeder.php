<?php

namespace Database\Seeders;

use App\Models\ExchangeRate;
use App\Models\ProductCategory;
use App\Models\SupplierJp;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        ProductCategory::query()->updateOrCreate(
            ['category_name' => 'Thực phẩm chức năng'],
            ['order_no' => 1, 'disabled_flag' => false, 'deleted_flag' => false, 'created' => now()],
        );

        SupplierJp::query()->updateOrCreate(
            ['supplier_cd' => 'JP001'],
            [
                'supplier_name' => 'Nhà cung cấp Demo JP',
                'supplier_name_jp' => 'デモサプライヤー',
                'disabled_flag' => false,
                'deleted_flag' => false,
                'created' => now(),
            ],
        );

        ExchangeRate::query()->updateOrCreate(
            [
                'from_currency' => 'JPY',
                'to_currency' => 'VND',
                'apply_date' => now()->toDateString(),
            ],
            [
                'rate' => 170.5,
                'created' => now(),
            ],
        );
    }
}
