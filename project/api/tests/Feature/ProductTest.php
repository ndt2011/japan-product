<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SupplierJp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_can_create_product(): void
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'Test Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $supplier = SupplierJp::query()->create([
            'supplier_name' => 'Supplier',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $response = $this->postJson('/api/products', [
            'product_category_id' => $category->id,
            'product_cd' => 'P100',
            'product_name' => 'Omega 3',
            'supplier_id' => $supplier->id,
            'cost_jpy' => 2000,
            'price_vnd' => 400000,
        ], $this->authHeaders());

        $response->assertCreated()
            ->assertJsonPath('message', 'M0301')
            ->assertJsonPath('data.product.product_cd', 'P100');
    }

    public function test_duplicate_product_cd_returns_conflict(): void
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'Test Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'DUP01',
            'product_name' => 'Existing',
            'deleted_flag' => false,
        ]);

        $response = $this->postJson('/api/products', [
            'product_category_id' => $category->id,
            'product_cd' => 'DUP01',
            'product_name' => 'New Product',
        ], $this->authHeaders());

        $response->assertStatus(409)
            ->assertJsonPath('message', 'M0302');
    }
}
