<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        Admin::factory()->create([
            'login_id' => 'tester',
            'password' => 'Secret@123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login_id' => 'tester',
            'password' => 'Secret@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'M0103')
            ->assertJsonStructure([
                'data' => ['user', 'token', 'token_type'],
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        Admin::factory()->create([
            'login_id' => 'tester',
            'password' => 'Secret@123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login_id' => 'tester',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'M0101');
    }

    public function test_disabled_admin_cannot_login(): void
    {
        Admin::factory()->create([
            'login_id' => 'disabled',
            'password' => 'Secret@123',
            'disabled_flag' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login_id' => 'disabled',
            'password' => 'Secret@123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'M0102');
    }

    public function test_authenticated_admin_can_fetch_profile(): void
    {
        $admin = Admin::factory()->create([
            'login_id' => 'me-user',
            'password' => 'Secret@123',
        ]);

        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('data.user.login_id', 'me-user')
            ->assertJsonPath('data.user.user_type', 'admin');
    }

    public function test_company_can_login(): void
    {
        \App\Models\CompanyVn::factory()->create([
            'login_id' => 'vn01',
            'password' => 'Secret@123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login_id' => 'vn01',
            'password' => 'Secret@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.user_type', 'company');
    }

    public function test_remember_me_sets_token_expiry_30_days(): void
    {
        $admin = Admin::factory()->create([
            'login_id' => 'remember-user',
            'password' => 'Secret@123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login_id' => 'remember-user',
            'password' => 'Secret@123',
            'remember_me' => true,
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['expires_at']]);

        $token = $admin->tokens()->first();
        $this->assertNotNull($token);
        $this->assertTrue($token->expires_at->greaterThan(now()->addDays(29)));
    }

    public function test_logout_revokes_token(): void
    {
        $admin = Admin::factory()->create([
            'login_id' => 'logout-user',
            'password' => 'Secret@123',
        ]);

        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'M0000');

        $this->assertEquals(0, $admin->fresh()->tokens()->count());
    }

    public function test_without_remember_me_sets_token_expiry_24_hours(): void
    {
        $admin = Admin::factory()->create([
            'login_id' => 'session-user',
            'password' => 'Secret@123',
        ]);

        $this->postJson('/api/auth/login', [
            'login_id' => 'session-user',
            'password' => 'Secret@123',
            'remember_me' => false,
        ])->assertOk();

        $token = $admin->tokens()->first();
        $this->assertNotNull($token);
        $this->assertTrue($token->expires_at->lessThanOrEqualTo(now()->addHours(24)->addMinute()));
        $this->assertTrue($token->expires_at->greaterThan(now()->addHours(23)));
    }
}
