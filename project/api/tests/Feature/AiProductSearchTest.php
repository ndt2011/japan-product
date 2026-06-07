<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SupplierJp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiProductSearchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.openai.api_key' => '']);
    }

    private function authHeaders(): array
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function seedProduct(string $cd, string $name, string $nameJp): Product
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'TPCN',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $supplier = SupplierJp::query()->create([
            'supplier_cd' => 'SUP-'.$cd,
            'supplier_name' => 'Supplier',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        return Product::query()->create([
            'product_category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'product_cd' => $cd,
            'product_name' => $name,
            'product_name_jp' => $nameJp,
            'cost_jpy' => 1000,
            'price_vnd' => 200000,
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);
    }

    public function test_keyword_search_returns_matching_products(): void
    {
        $this->seedProduct('COL-01', 'Collagen DHC', 'DHC コラーゲン');
        $this->seedProduct('VIT-01', 'Vitamin C', 'ビタミンC');

        $response = $this->postJson('/api/ai/product-search', [
            'query' => 'collagen',
            'limit' => 10,
        ], $this->authHeaders());

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.count', 1)
            ->assertJsonPath('data.items.0.product_cd', 'COL-01')
            ->assertJsonPath('data.expanded_query', 'collagen');
    }

    public function test_keyword_search_matches_name_vi_field(): void
    {
        $product = $this->seedProduct('LIV-01', 'Liver Support', '肝臓サポート');
        $product->update([
            'name_vi' => 'Viên uống bổ gan Orihiro',
            'description_vi' => 'Hỗ trợ chức năng gan, giải độc',
        ]);

        $response = $this->postJson('/api/ai/product-search', [
            'query' => 'bổ gan',
            'limit' => 10,
        ], $this->authHeaders());

        $response->assertOk()
            ->assertJsonPath('data.count', 1)
            ->assertJsonPath('data.items.0.product_cd', 'LIV-01')
            ->assertJsonPath('data.items.0.name_vi', 'Viên uống bổ gan Orihiro');
    }

    public function test_empty_results_return_m0201(): void
    {
        $this->seedProduct('XYZ-01', 'Unrelated Item', '無関係');

        $response = $this->postJson('/api/ai/product-search', [
            'query' => 'zzzznotfoundkeyword',
        ], $this->authHeaders());

        $response->assertOk()
            ->assertJsonPath('message', 'M0201')
            ->assertJsonPath('data.count', 0);
    }

    public function test_validation_requires_query(): void
    {
        $response = $this->postJson('/api/ai/product-search', [
            'query' => 'a',
        ], $this->authHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('message', 'M0001');
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson('/api/ai/product-search', [
            'query' => 'collagen',
        ]);

        $response->assertUnauthorized();
    }
}
