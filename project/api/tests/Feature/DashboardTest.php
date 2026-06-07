<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_get_dashboard_stats(): void
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        $category = ProductCategory::query()->create([
            'category_name' => 'Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);
        Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'D01',
            'product_name' => 'Dash Product',
            'deleted_flag' => false,
        ]);

        $company = CompanyVn::query()->create([
            'login_id' => 'co1',
            'password' => 'x',
            'company_name' => 'Co',
            'disabled_flag' => false,
            'deleted_flag' => false,
            'created' => now(),
        ]);

        Order::query()->create([
            'company_vn_id' => $company->id,
            'order_no' => 'ORD-DASH-01',
            'status' => 'PENDING',
            'order_date' => now()->toDateString(),
            'total_jpy' => '1000',
            'total_vnd' => '500000',
            'exchange_rate' => 170,
            'created' => now(),
            'deleted_flag' => false,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('data.orders_today', 1)
            ->assertJsonPath('data.products_total', 1)
            ->assertJsonStructure(['data' => ['orders_by_status', 'exchange_rate']]);
    }
}
