<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShipmentBatchTest extends TestCase
{
    use RefreshDatabase;

    private function adminHeaders(): array
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function companyHeaders(int $companyId): array
    {
        $company = CompanyVn::query()->find($companyId);
        $token = $company->createToken('test')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    private function confirmedOrder(int $companyId): Order
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
            'product_cd' => 'BAT-P'.uniqid(),
            'product_name' => 'Batch Product',
            'cost_jpy' => 1000,
            'price_vnd' => 200000,
            'deleted_flag' => false,
        ]);

        Inventory::query()->create([
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 50,
            'reserved_qty' => 0,
            'deleted_flag' => false,
        ]);

        return Order::query()->create([
            'company_vn_id' => $companyId,
            'order_no' => 'ORD-TEST-'.uniqid(),
            'status' => 'CONFIRMED',
            'order_date' => now()->toDateString(),
            'total_jpy' => '1000',
            'total_vnd' => '200000',
            'exchange_rate' => 170.5,
            'deleted_flag' => false,
        ]);
    }

    public function test_admin_can_create_batch_from_confirmed_orders(): void
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VN1',
            'login_id' => 'vn1',
            'password' => 'pass',
            'company_name' => 'Company One',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $order1 = $this->confirmedOrder($company->id);
        $order2 = $this->confirmedOrder($company->id);

        $response = $this->postJson('/api/shipment-batches', [
            'batch_name' => 'Chuyến tháng 6',
            'order_ids' => [$order1->id, $order2->id],
            'logistics_partner' => 'DHL',
        ], $this->adminHeaders());

        $response->assertCreated()
            ->assertJsonPath('message', 'M0506')
            ->assertJsonPath('data.batch.status', 'PREPARING');

        $this->assertDatabaseHas('orders', ['id' => $order1->id, 'status' => 'PROCESSING']);
    }

    public function test_cannot_add_pending_order_to_batch(): void
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VN2',
            'login_id' => 'vn2',
            'password' => 'pass',
            'company_name' => 'Company Two',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $order = Order::query()->create([
            'company_vn_id' => $company->id,
            'order_no' => 'ORD-PEND',
            'status' => 'PENDING',
            'order_date' => now()->toDateString(),
            'total_jpy' => '1000',
            'total_vnd' => '200000',
            'deleted_flag' => false,
        ]);

        $response = $this->postJson('/api/shipment-batches', [
            'batch_name' => 'Bad batch',
            'order_ids' => [$order->id],
        ], $this->adminHeaders());

        $response->assertStatus(422)
            ->assertJsonPath('message', 'M0501');
    }

    public function test_advance_status_to_delivered_updates_orders(): void
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VN3',
            'login_id' => 'vn3',
            'password' => 'pass',
            'company_name' => 'Company Three',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $order = $this->confirmedOrder($company->id);
        $headers = $this->adminHeaders();

        $create = $this->postJson('/api/shipment-batches', [
            'batch_name' => 'Full flow',
            'order_ids' => [$order->id],
        ], $headers);

        $batchId = $create->json('data.batch.id');

        foreach (['CUSTOMS_JP', 'IN_TRANSIT', 'CUSTOMS_VN', 'DELIVERED'] as $status) {
            $this->putJson("/api/shipment-batches/{$batchId}/status", ['status' => $status], $headers)
                ->assertOk();
        }

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'DELIVERED_ADMIN']);
    }

    public function test_company_can_view_batch_with_own_order(): void
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VN4',
            'login_id' => 'vn4',
            'password' => 'pass',
            'company_name' => 'Company Four',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $order = $this->confirmedOrder($company->id);
        $adminHeaders = $this->adminHeaders();

        $create = $this->postJson('/api/shipment-batches', [
            'batch_name' => 'Visible batch',
            'order_ids' => [$order->id],
        ], $adminHeaders);

        $batchId = $create->json('data.batch.id');

        $this->getJson("/api/shipment-batches/{$batchId}", $this->companyHeaders($company->id))
            ->assertOk()
            ->assertJsonPath('data.batch.id', $batchId);
    }

    public function test_company_cannot_view_other_company_batch(): void
    {
        $companyA = CompanyVn::query()->create([
            'company_cd' => 'VNA',
            'login_id' => 'vna',
            'password' => 'pass',
            'company_name' => 'A',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $companyB = CompanyVn::query()->create([
            'company_cd' => 'VNB',
            'login_id' => 'vnb',
            'password' => 'pass',
            'company_name' => 'B',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $order = $this->confirmedOrder($companyA->id);

        $create = $this->postJson('/api/shipment-batches', [
            'batch_name' => 'Private batch',
            'order_ids' => [$order->id],
        ], $this->adminHeaders());

        $batchId = $create->json('data.batch.id');

        $this->getJson("/api/shipment-batches/{$batchId}", $this->companyHeaders($companyB->id))
            ->assertStatus(403)
            ->assertJsonPath('message', 'M0507');
    }

    public function test_cannot_modify_orders_when_in_transit(): void
    {
        $company = CompanyVn::query()->create([
            'company_cd' => 'VN5',
            'login_id' => 'vn5',
            'password' => 'pass',
            'company_name' => 'Company Five',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $order1 = $this->confirmedOrder($company->id);
        $order2 = $this->confirmedOrder($company->id);
        $headers = $this->adminHeaders();

        $create = $this->postJson('/api/shipment-batches', [
            'batch_name' => 'Locked batch',
            'order_ids' => [$order1->id],
        ], $headers);

        $batchId = $create->json('data.batch.id');

        $this->putJson("/api/shipment-batches/{$batchId}/status", ['status' => 'CUSTOMS_JP'], $headers)->assertOk();
        $this->putJson("/api/shipment-batches/{$batchId}/status", ['status' => 'IN_TRANSIT'], $headers)->assertOk();

        $this->putJson("/api/shipment-batches/{$batchId}", [
            'order_ids' => [$order1->id, $order2->id],
        ], $headers)
            ->assertStatus(409)
            ->assertJsonPath('message', 'M0504');
    }
}
