<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::query()->updateOrCreate(
            ['login_id' => 'admin'],
            [
                'password' => 'Admin@123',
                'full_name' => 'Super Admin',
                'email' => 'admin@japan-product.local',
                'disabled_flag' => false,
                'deleted_flag' => false,
                'created' => now(),
            ],
        );
    }
}
