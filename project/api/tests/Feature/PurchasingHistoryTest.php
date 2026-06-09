<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\PurchasingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchasingHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_purchasing_history(): void
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        PurchasingSession::query()->create([
            'user_type' => 'admin',
            'user_id' => $admin->id,
            'query' => 'vitamin C Nhật',
            'keyword_jp' => 'ビタミンC',
            'budget_jpy' => 3000,
            'qty' => 10,
            'status' => 'completed',
            'response_json' => [
                'success' => true,
                'query' => 'vitamin C Nhật',
                'results' => [['total_score' => 8.5]],
                'recommendation' => ['total_score' => 8.5],
            ],
            'created' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/ai/purchasing/history');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.query', 'vitamin C Nhật')
            ->assertJsonPath('data.items.0.top_score', 8.5);
    }

    public function test_admin_can_view_purchasing_session_detail(): void
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $session = PurchasingSession::query()->create([
            'user_type' => 'admin',
            'user_id' => $admin->id,
            'query' => 'collagen DHC',
            'keyword_jp' => 'DHC コラーゲン',
            'status' => 'completed',
            'response_json' => [
                'success' => true,
                'query' => 'collagen DHC',
                'results' => [],
                'report' => 'Báo cáo test',
            ],
            'created' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/ai/purchasing/{$session->id}");

        $response->assertOk()
            ->assertJsonPath('data.session.query', 'collagen DHC')
            ->assertJsonPath('data.report', 'Báo cáo test');
    }

    public function test_user_cannot_view_other_users_session(): void
    {
        $admin = Admin::factory()->create();
        $other = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $session = PurchasingSession::query()->create([
            'user_type' => 'admin',
            'user_id' => $other->id,
            'query' => 'private',
            'status' => 'completed',
            'response_json' => ['success' => true],
            'created' => now(),
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/ai/purchasing/{$session->id}")
            ->assertStatus(404);
    }
}
