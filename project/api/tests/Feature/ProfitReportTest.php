<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfitReportTest extends TestCase
{
    use RefreshDatabase;

    private function seedCompletedOrder(): array
    {
        $admin = Admin::factory()->create();
        $company = CompanyVn::query()->create([
            'login_id' => 'profit_co',
            'password' => 'x',
            'company_name' => 'Profit Co',
            'email' => 'profit@test.com',
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ]);

        $category = ProductCategory::query()->create([
            'category_name' => 'Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $product = Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'PRF-P1',
            'product_name' => 'Profit Product',
            'name_vi' => 'Sản phẩm lợi nhuận',
            'cost_price_jpy' => 800,
            'selling_price_jpy' => 1000,
            'fee_rate' => 0.05,
            'deleted_flag' => false,
        ]);

        $order = Order::query()->create([
            'company_vn_id' => $company->id,
            'order_no' => 'ORD-PRF-01',
            'status' => 'COMPLETED',
            'order_date' => now()->toDateString(),
            'completed_at' => now(),
            'exchange_rate' => 170,
            'created' => now(),
            'deleted_flag' => false,
        ]);

        OrderDetail::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price_vnd' => '178500',
            'subtotal_vnd' => '357000',
            'created' => now(),
            'deleted_flag' => false,
        ]);

        return compact('admin', 'product', 'order');
    }

    public function test_admin_can_get_profit_summary(): void
    {
        ['admin' => $admin] = $this->seedCompletedOrder();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/reports/profit');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.order_count', 1)
            ->assertJsonCount(1, 'data.by_order');
    }

    public function test_admin_can_get_profit_by_product(): void
    {
        ['admin' => $admin, 'product' => $product] = $this->seedCompletedOrder();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/reports/profit/by-product?limit=5');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.product_id', $product->id)
            ->assertJsonPath('data.items.0.product_cd', 'PRF-P1')
            ->assertJsonPath('data.items.0.product_name_vi', 'Sản phẩm lợi nhuận')
            ->assertJsonPath('data.items.0.quantity_sold', 2);
    }
}
