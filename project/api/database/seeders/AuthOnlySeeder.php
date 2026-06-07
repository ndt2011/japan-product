<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Chỉ tài khoản demo — không sản phẩm / kho / đơn hàng mẫu.
 * Dùng sau migrate:fresh trên staging.
 */
class AuthOnlySeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            CompanyVnSeeder::class,
        ]);
    }
}
