<?php

namespace Tests\Feature;

use App\Models\CompanyVn;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\Ai\AiOrderHistoryInsightService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiOrderHistoryInsightTest extends TestCase
{
    use RefreshDatabase;

    public function test_insights_from_company_order_history(): void
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VN-AI',
            'login_id' => 'vn_ai',
            'password' => 'pass',
            'company_name' => 'AI Test Co',
            'email' => 'ai-test@example.com',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $category = ProductCategory::query()->create([
            'category_name' => 'Vitamin',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $product = Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'AI-P1',
            'product_name' => 'Vitamin C JP',
            'name_vi' => 'Vitamin C Nhật',
            'cost_jpy' => 1000,
            'price_vnd' => 200000,
            'deleted_flag' => false,
        ]);

        $order = Order::query()->create([
            'company_vn_id' => $company->id,
            'order_no' => 'ORD-AI-001',
            'status' => 'COMPLETED',
            'total_vnd' => 400000,
            'deleted_flag' => false,
            'created' => now(),
        ]);

        OrderDetail::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price_vnd' => 200000,
            'subtotal_vnd' => 400000,
            'deleted_flag' => false,
        ]);

        $service = new AiOrderHistoryInsightService;
        $insights = $service->insightsForUser($company, 'company');

        $this->assertNotEmpty($insights['top_products']);
        $this->assertSame('Vitamin C Nhật', $insights['top_products'][0]['name']);
        $this->assertStringContainsString('Vitamin C Nhật', $insights['summary']);
    }
}
