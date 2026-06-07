<?php

namespace Database\Seeders;

use App\Models\CompanyVn;
use Illuminate\Database\Seeder;

class CompanyVnSeeder extends Seeder
{
    public function run(): void
    {
        $company = CompanyVn::query()->updateOrCreate(
            ['login_id' => 'vn_company01'],
            [
                'password' => 'Company@123',
                'company_cd' => 'VN001',
                'company_name' => 'Công ty TNHH Thương mại XNK Việt Nam',
                'email' => 'contact@xnk-vietnam.vn',
                'contact_name' => 'Nguyễn Minh Tuấn',
                'disabled_flag' => false,
                'deleted_flag' => false,
                'created' => now(),
            ],
        );

        if (! $company->wasRecentlyCreated) {
            $company->password = 'Company@123';
            $company->save();
        }
    }
}
