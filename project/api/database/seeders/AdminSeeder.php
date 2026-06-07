<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::query()->updateOrCreate(
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

        // Luôn reset mật khẩu demo (tránh hash lỗi sau migrate:test / seed cũ)
        if (! $admin->wasRecentlyCreated) {
            $admin->password = 'Admin@123';
            $admin->save();
        }
    }
}
