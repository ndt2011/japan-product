<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function adminHeaders(): array
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function companyHeaders(): array
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VNTEST',
            'login_id' => 'vn_test',
            'password' => 'pass',
            'company_name' => 'Test Company',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);
        $token = $company->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function productWithStock(int $qty = 100): Product
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'Test',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $warehouse = Warehouse::query()->create([
            'warehouse_name' => 'Kho Test',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $product = Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'ORD-P1',
            'product_name' => 'Order Product',
            'cost_jpy' => 1000,
            'price_vnd' => 200000,
            'deleted_flag' => false,
        ]);

        Inventory::query()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => $qty,
            'reserved_qty' => 0,
            'deleted_flag' => false,
        ]);

        return $product;
    }

    public function test_company_can_create_draft_order(): void
    {
        $product = $this->productWithStock();
        $headers = $this->companyHeaders();

        $response = $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ], $headers);

        $response->assertCreated()
            ->assertJsonPath('message', 'M0403')
            ->assertJsonPath('data.order.status', 'DRAFT');
    }

    public function test_submit_order_reserves_inventory(): void
    {
        $product = $this->productWithStock(10);
        $headers = $this->companyHeaders();

        $create = $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ], $headers);

        $orderId = $create->json('data.order.id');

        $submit = $this->putJson("/api/orders/{$orderId}/submit", [], $headers);

        $submit->assertOk()
            ->assertJsonPath('data.order.status', 'PENDING');

        $this->assertDatabaseHas('inventories', [
            'product_id' => $product->id,
            'reserved_qty' => 3,
        ]);
    }

    public function test_cannot_order_more_than_stock(): void
    {
        $product = $this->productWithStock(2);
        $headers = $this->companyHeaders();

        $response = $this->postJson('/api/orders', [
            'submit' => true,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5],
            ],
        ], $headers);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'M0401');
    }

    public function test_admin_can_confirm_pending_order(): void
    {
        $product = $this->productWithStock();
        $companyHeaders = $this->companyHeaders();

        $create = $this->postJson('/api/orders', [
            'submit' => true,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ], $companyHeaders);

        $orderId = $create->json('data.order.id');
        $adminHeaders = $this->adminHeaders();

        $confirm = $this->putJson("/api/orders/{$orderId}/confirm", [], $adminHeaders);

        $confirm->assertOk()
            ->assertJsonPath('message', 'M0404')
            ->assertJsonPath('data.order.status', 'CONFIRMED');
    }

    public function test_company_cannot_access_other_company_order(): void
    {
        $product = $this->productWithStock();
        $companyA = $this->companyHeaders();

        $create = $this->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ], $companyA);

        $orderId = $create->json('data.order.id');

        $companyB = CompanyVn::query()->create([
            'company_cd' => 'VNB',
            'login_id' => 'vn_b',
            'password' => 'pass',
            'company_name' => 'Company B',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);
        $tokenB = $companyB->createToken('test')->plainTextToken;

        $show = $this->getJson("/api/orders/{$orderId}", [
            'Authorization' => "Bearer {$tokenB}",
        ]);

        $show->assertStatus(403)
            ->assertJsonPath('message', 'M0407');
    }
}
