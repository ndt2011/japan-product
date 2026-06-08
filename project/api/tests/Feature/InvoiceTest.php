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

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    private function seedConfirmedOrder(): array
    {
        $admin = Admin::factory()->create();
        $company = CompanyVn::query()->create([
            'login_id' => 'inv_co',
            'password' => 'x',
            'company_name' => 'Invoice Co',
            'email' => 'inv@test.com',
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
            'product_cd' => 'INV-P1',
            'product_name' => 'Invoice Product',
            'price_vnd' => 100000,
            'cost_price_jpy' => 800,
            'selling_price_jpy' => 1000,
            'fee_rate' => 0.05,
            'deleted_flag' => false,
        ]);

        $order = Order::query()->create([
            'company_vn_id' => $company->id,
            'order_no' => 'ORD-INV-01',
            'status' => 'CONFIRMED',
            'order_date' => now()->toDateString(),
            'total_jpy' => '1000',
            'total_vnd' => '200000',
            'exchange_rate' => 170,
            'created' => now(),
            'deleted_flag' => false,
        ]);

        OrderDetail::query()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price_vnd' => '100000',
            'subtotal_vnd' => '200000',
            'created' => now(),
            'deleted_flag' => false,
        ]);

        return compact('admin', 'company', 'order');
    }

    public function test_admin_can_create_invoice_from_confirmed_order(): void
    {
        ['admin' => $admin, 'order' => $order] = $this->seedConfirmedOrder();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/invoices', ['order_id' => $order->id]);

        // unit_price_vnd = selling_price_jpy × locked_rate × (1 + fee_rate)
        // = 1000 × 170 × 1.05 = 178500; qty 2 → total 357000
        $expectedTotal = (string) (178500 * 2);

        $response->assertCreated()
            ->assertJsonPath('data.invoice.order_id', $order->id)
            ->assertJsonPath('data.invoice.status', 'draft')
            ->assertJsonPath('data.invoice.total_amount', $expectedTotal);

        $this->assertDatabaseHas('invoice_items', [
            'product_name_jp' => 'Invoice Product',
            'quantity' => 2,
        ]);
    }

    public function test_admin_can_send_and_pay_invoice(): void
    {
        ['admin' => $admin, 'order' => $order] = $this->seedConfirmedOrder();
        $token = $admin->createToken('test')->plainTextToken;

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/invoices', ['order_id' => $order->id]);
        $invoiceId = $create->json('data.invoice.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/invoices/{$invoiceId}/send")
            ->assertOk()
            ->assertJsonPath('data.invoice.status', 'sent');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/invoices/{$invoiceId}/pay", ['payment_method' => 'bank_transfer'])
            ->assertOk()
            ->assertJsonPath('data.invoice.status', 'paid');
    }

    public function test_company_can_list_own_invoices(): void
    {
        ['admin' => $admin, 'company' => $company, 'order' => $order] = $this->seedConfirmedOrder();
        $adminToken = $admin->createToken('test')->plainTextToken;
        $companyToken = $company->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/invoices', ['order_id' => $order->id])
            ->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$companyToken}")
            ->getJson('/api/invoices');

        $response->assertOk()
            ->assertJsonCount(1, 'data.items');
    }

    public function test_debt_summary_lists_unpaid_invoices(): void
    {
        ['admin' => $admin, 'order' => $order] = $this->seedConfirmedOrder();
        $token = $admin->createToken('test')->plainTextToken;

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/invoices', ['order_id' => $order->id]);
        $invoiceId = $create->json('data.invoice.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/invoices/{$invoiceId}/send")
            ->assertOk();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/invoices/debt-summary');

        $response->assertOk()
            ->assertJsonPath('data.invoice_count', 1)
            ->assertJsonPath('data.total_unpaid_vnd', 357000);
    }
}
