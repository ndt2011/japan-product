<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchUser;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::query()->firstOrCreate(
            ['branch_cd' => 'CN-HN-01'],
            [
                'branch_name' => 'Chi nhánh Hà Nội',
                'region' => 'Bắc',
                'province' => 'Hà Nội',
                'address' => '123 Phố Huế, Hà Nội',
                'tel' => '024-1234567',
                'disabled_flag' => false,
                'created' => now(),
                'created_user_id' => 1,
                'deleted_flag' => false,
            ],
        );

        BranchUser::query()->firstOrCreate(
            ['login_id' => 'hn_manager'],
            [
                'branch_id' => $branch->id,
                'password' => 'Manager@123',
                'full_name' => 'HN Manager',
                'email' => 'hn.manager@example.com',
                'role' => 'manager',
                'disabled_flag' => false,
                'created' => now(),
                'created_user_id' => 1,
                'deleted_flag' => false,
            ],
        );

        BranchUser::query()->firstOrCreate(
            ['login_id' => 'hn_staff'],
            [
                'branch_id' => $branch->id,
                'password' => 'Staff@123',
                'full_name' => 'HN Staff',
                'email' => 'hn.staff@example.com',
                'role' => 'staff',
                'disabled_flag' => false,
                'created' => now(),
                'created_user_id' => 1,
                'deleted_flag' => false,
            ],
        );
    }
}
