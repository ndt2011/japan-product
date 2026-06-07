<?php

namespace Database\Seeders;

use App\Models\CompanyVn;
use Illuminate\Database\Seeder;

class CompanyVnSeeder extends Seeder
{
    public function run(): void
    {
        CompanyVn::query()->updateOrCreate(
            ['login_id' => 'vn_company01'],
            [
                'company_cd' => 'VN001',
                'password' => 'Company@123',
                'company_name' => 'Công ty Demo Việt Nam',
                'email' => 'demo@company.vn',
                'contact_name' => 'Nguyễn Văn A',
                'disabled_flag' => false,
                'deleted_flag' => false,
                'created' => now(),
            ],
        );
    }
}
