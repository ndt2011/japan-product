<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiSearchTest extends TestCase
{
    use RefreshDatabase;

    private array $authHeaders = [];

    protected function setUp(): void
    {
        parent::setUp();
        config(['queue.default' => 'sync']);

        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;
        $this->authHeaders = ['Authorization' => "Bearer {$token}"];
    }

    private function authHeaders(): array
    {
        return $this->authHeaders;
    }

    public function test_search_returns_products_for_collagen_keyword(): void
    {
        config([
            'services.openai.api_key' => 'test-key',
            'services.rakuten.application_id' => '',
            'services.rakuten.access_key' => '',
        ]);

        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                [
                                    'product_name_jp' => 'DHC コラーゲン 360粒',
                                    'price_jpy' => 1188,
                                    'source_platform' => 'rakuten',
                                    'description' => 'コラーゲンサプリ',
                                ],
                            ], JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $start = $this->postJson('/api/ai/search', [
            'keyword' => 'コラーゲン',
        ], $this->authHeaders());

        $start->assertStatus(202)
            ->assertJsonPath('success', true);

        $sessionId = $start->json('data.session.id');

        $poll = $this->getJson("/api/ai/search/{$sessionId}", $this->authHeaders());

        $poll->assertOk()
            ->assertJsonPath('data.session.status', 'completed');

        $items = $poll->json('data.session.items');
        $this->assertIsArray($items);
        $this->assertGreaterThanOrEqual(1, count($items));
        $this->assertLessThanOrEqual(10, count($items));
    }

    public function test_search_empty_returns_m0201(): void
    {
        $start = $this->postJson('/api/ai/search', [
            'keyword' => 'xyzabc123none',
        ], $this->authHeaders());

        $sessionId = $start->json('data.session.id');

        $poll = $this->getJson("/api/ai/search/{$sessionId}", $this->authHeaders());

        $poll->assertOk()
            ->assertJsonPath('message', 'M0201')
            ->assertJsonPath('data.session.items', []);
    }

    public function test_submit_candidates_creates_pending_records(): void
    {
        $response = $this->postJson('/api/ai/candidates', [
            'items' => [
                [
                    'product_name_jp' => 'DHC コラーゲン',
                    'price_jpy' => 1188,
                    'source_platform' => 'rakuten',
                ],
                [
                    'product_name_jp' => 'ファンケル ビタミンC',
                    'price_jpy' => 1020,
                    'source_platform' => 'rakuten',
                ],
                [
                    'product_name_jp' => '大塚 オメガ3',
                    'price_jpy' => 2480,
                    'source_platform' => 'amazon',
                ],
            ],
        ], $this->authHeaders());

        $response->assertCreated()
            ->assertJsonPath('message', 'M0203')
            ->assertJsonCount(3, 'data.items');

        $this->assertDatabaseCount('ai_product_candidates', 3);
        $this->assertDatabaseHas('ai_product_candidates', ['status' => 'PENDING']);
    }

    public function test_approve_candidate_creates_product(): void
    {
        \App\Models\ExchangeRate::query()->create([
            'from_currency' => 'JPY',
            'to_currency' => 'VND',
            'rate' => 170,
            'apply_date' => now()->toDateString(),
            'deleted_flag' => false,
            'created' => now(),
        ]);

        $category = ProductCategory::query()->create([
            'category_name' => 'TPCN',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $submit = $this->postJson('/api/ai/candidates', [
            'items' => [
                [
                    'product_name_jp' => 'DHC コラーゲン 360粒',
                    'price_jpy' => 1000,
                    'image_url' => 'https://example.com/img.jpg',
                    'source_platform' => 'rakuten',
                    'usage_instructions' => 'Uống 2 viên/ngày',
                ],
            ],
        ], $this->authHeaders());

        $candidateId = $submit->json('data.items.0.id');

        $approve = $this->putJson("/api/ai/candidates/{$candidateId}/approve", [
            'product_category_id' => $category->id,
            'product_name_vn' => 'Collagen DHC 360 viên',
        ], $this->authHeaders());

        $approve->assertOk()
            ->assertJsonPath('message', 'M0204')
            ->assertJsonPath('data.candidate.status', 'APPROVED');

        $expectedVnd = app(\App\Services\ProductPricingService::class)->calculateSellingPriceVnd(1000);

        $this->assertDatabaseHas('products', [
            'product_name' => 'Collagen DHC 360 viên',
            'product_name_jp' => 'DHC コラーゲン 360粒',
            'cost_jpy' => 1000,
            'price_vnd' => $expectedVnd,
        ]);
    }

    public function test_reject_without_reason_returns_validation_error(): void
    {
        $submit = $this->postJson('/api/ai/candidates', [
            'items' => [
                ['product_name_jp' => 'Test Product'],
            ],
        ], $this->authHeaders());

        $candidateId = $submit->json('data.items.0.id');

        $reject = $this->putJson("/api/ai/candidates/{$candidateId}/reject", [
            'reason' => 'short',
        ], $this->authHeaders());

        $reject->assertStatus(422)
            ->assertJsonPath('message', 'M0001');
    }

    public function test_reject_with_reason_updates_status(): void
    {
        $submit = $this->postJson('/api/ai/candidates', [
            'items' => [
                ['product_name_jp' => 'Test Product Reject'],
            ],
        ], $this->authHeaders());

        $candidateId = $submit->json('data.items.0.id');

        $reject = $this->putJson("/api/ai/candidates/{$candidateId}/reject", [
            'reason' => 'Sản phẩm không phù hợp với danh mục hiện tại',
        ], $this->authHeaders());

        $reject->assertOk()
            ->assertJsonPath('message', 'M0205')
            ->assertJsonPath('data.candidate.status', 'REJECTED');
    }
}
