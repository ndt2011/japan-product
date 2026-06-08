<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Inventory;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShipmentBatch;
use App\Models\Warehouse;
use App\Services\InventoryService;
use App\Services\InvoiceService;
use App\Services\OrderService;
use App\Services\ShipmentBatchService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Dữ liệu demo để test đủ chức năng: kho, đơn COMPLETED, hóa đơn, profit report.
 * Chạy: php artisan db:seed --class=StagingDemoSeeder
 */
class StagingDemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::query()->where('login_id', 'admin')->first();
        $company = CompanyVn::query()->where('login_id', 'vn_company01')->first();

        if (! $admin || ! $company) {
            $this->command?->error('Chạy DatabaseSeeder trước (admin + vn_company01).');

            return;
        }

        $warehouse = Warehouse::query()->firstOrCreate(
            ['warehouse_cd' => 'WH-VN-01'],
            [
                'warehouse_name' => 'Kho Hà Nội (VN)',
                'address' => 'Kho trung tâm Hà Nội',
                'country' => 'VN',
                'manager_name' => 'Admin',
                'disabled_flag' => false,
                'created' => now(),
                'created_user_id' => $admin->id,
                'deleted_flag' => false,
            ],
        );

        $products = Product::query()
            ->active()
            ->orderBy('id')
            ->limit(3)
            ->get();

        if ($products->isEmpty()) {
            $this->command?->warn('Không có sản phẩm — bỏ qua seed demo.');

            return;
        }

        /** @var InventoryService $inventory */
        $inventory = app(InventoryService::class);

        foreach ($products as $product) {
            if (! $product->selling_price_jpy) {
                $cost = (float) ($product->cost_jpy ?? 1000);
                $product->update([
                    'cost_price_jpy'    => $cost,
                    'selling_price_jpy' => $cost * 1.2,
                    'fee_rate'          => 0.05,
                ]);
            }

            $inventory->stockIn(
                (int) $product->id,
                (int) $warehouse->id,
                50,
                (int) $admin->id,
                'StagingDemoSeeder — nhập kho ban đầu',
                'seed',
                null,
            );
        }

        $completedCount = Order::query()->where('status', 'COMPLETED')->count();

        if ($completedCount > 0) {
            $this->command?->info("Đã có {$completedCount} đơn COMPLETED — bỏ qua tạo đơn demo.");

            return;
        }

        /** @var OrderService $orderService */
        $orderService = app(OrderService::class);
        /** @var ShipmentBatchService $batchService */
        $batchService = app(ShipmentBatchService::class);
        /** @var InvoiceService $invoiceService */
        $invoiceService = app(InvoiceService::class);

        DB::transaction(function () use ($orderService, $batchService, $invoiceService, $admin, $company, $products, $warehouse) {
            $order = $orderService->store([
                'items' => [
                    ['product_id' => $products[0]->id, 'quantity' => 2],
                    ['product_id' => $products[1]->id ?? $products[0]->id, 'quantity' => 1],
                ],
            ], $company, 'company', submit: true);

            $order = $orderService->confirm($order->id, $admin);

            $batch = $batchService->store([
                'batch_name' => 'Chuyến demo seed '.now()->format('Y-m-d'),
                'order_ids'  => [$order->id],
            ], $admin);

            foreach (['CUSTOMS_JP', 'IN_TRANSIT', 'CUSTOMS_VN', 'DELIVERED'] as $status) {
                $batch = $batchService->advanceStatus($batch->id, $status, $admin);
            }

            $order = $orderService->confirmReceipt($order->id, $company, 'company');

            $invoice = Invoice::query()->where('order_id', $order->id)->first();
            if ($invoice && $invoice->status === 'draft') {
                $invoiceService->send($invoice->id, $admin);
            }
        });

        $this->command?->info('StagingDemoSeeder: kho + đơn COMPLETED + hóa đơn sent đã sẵn sàng.');
    }
}
