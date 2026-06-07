<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Chỉ tài khoản hệ thống — không seed sản phẩm / kho / đơn hàng.
 * Dùng sau migrate:fresh trên staging hoặc local.
 */
class AuthOnlySeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            CompanyVnSeeder::class,
            ProductCategorySeeder::class,
            ExchangeRateSeeder::class,
        ]);
    }
}
