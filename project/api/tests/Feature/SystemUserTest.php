<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanyVn;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemUserTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): string
    {
        $admin = Admin::factory()->create();
        return $admin->createToken('test')->plainTextToken;
    }

    public function test_admin_can_list_and_create_company_user(): void
    {
        $token = $this->adminToken();

        $list = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/company-users');
        $list->assertOk();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/company-users', [
                'login_id' => 'vn_test01',
                'password' => 'Company@999',
                'company_cd' => 'VN999',
                'company_name' => 'Công ty test',
                'contact_name' => 'Tester',
            ]);

        $create->assertCreated()
            ->assertJsonPath('message', 'M0111')
            ->assertJsonPath('data.user.user_type', 'company');

        $login = $this->postJson('/api/auth/login', [
            'login_id' => 'vn_test01',
            'password' => 'Company@999',
        ]);
        $login->assertOk()->assertJsonPath('data.user.user_type', 'company');
    }

    public function test_admin_can_create_admin_user(): void
    {
        $token = $this->adminToken();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin-users', [
                'login_id' => 'admin_test',
                'password' => 'Admin@999',
                'full_name' => 'Test Admin',
                'email' => 'test@example.com',
            ]);

        $create->assertCreated()
            ->assertJsonPath('message', 'M0110')
            ->assertJsonPath('data.user.user_type', 'admin');
    }

    public function test_company_cannot_access_user_management(): void
    {
        $company = CompanyVn::query()->create([
            'login_id' => 'co_only',
            'password' => 'Company@123',
            'company_name' => 'Co',
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ]);
        $token = $company->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/company-users')
            ->assertStatus(403);
    }
}
