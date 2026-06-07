<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function createProduct(): Product
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'Test Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        return Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'WH01',
            'product_name' => 'Warehouse Product',
            'deleted_flag' => false,
        ]);
    }

    public function test_admin_can_stock_in_and_list_inventory(): void
    {
        $warehouse = Warehouse::query()->create([
            'warehouse_cd' => 'WH-VN-01',
            'warehouse_name' => 'Kho Test',
            'country' => 'VN',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);
        $product = $this->createProduct();

        $response = $this->postJson('/api/stock-movements', [
            'movement_type' => 'IN',
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 50,
            'reason' => 'Test nhập kho',
        ], $this->authHeaders());

        $response->assertCreated()
            ->assertJsonPath('message', 'M1001')
            ->assertJsonPath('data.movement.quantity_after', 50);

        $list = $this->getJson('/api/inventories', $this->authHeaders());
        $list->assertOk()
            ->assertJsonPath('data.items.0.quantity', 50)
            ->assertJsonPath('data.items.0.available_qty', 50);
    }

    public function test_company_cannot_access_warehouse_api(): void
    {
        $company = CompanyVn::factory()->create([
            'login_id' => 'vn_test_wh',
            'password' => bcrypt('password'),
        ]);
        $token = $company->createToken('test')->plainTextToken;

        $response = $this->getJson('/api/inventories', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertForbidden()->assertJsonPath('message', 'M0403');
    }

    public function test_reports_orders_accessible(): void
    {
        $response = $this->getJson('/api/reports/orders', $this->authHeaders());
        $response->assertOk()->assertJsonPath('message', 'M1100');
    }
}
