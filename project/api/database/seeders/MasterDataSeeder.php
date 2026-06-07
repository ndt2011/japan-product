<?php

namespace Database\Seeders;

use App\Models\ExchangeRate;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SupplierJp;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        ProductCategory::query()->updateOrCreate(
            ['category_name' => 'Thực phẩm chức năng'],
            ['order_no' => 1, 'disabled_flag' => false, 'deleted_flag' => false, 'created' => now()],
        );

        SupplierJp::query()->updateOrCreate(
            ['supplier_cd' => 'JP001'],
            [
                'supplier_name' => 'Nhà cung cấp Demo JP',
                'supplier_name_jp' => 'デモサプライヤー',
                'disabled_flag' => false,
                'deleted_flag' => false,
                'created' => now(),
            ],
        );

        ExchangeRate::query()->updateOrCreate(
            [
                'from_currency' => 'JPY',
                'to_currency' => 'VND',
                'apply_date' => now()->toDateString(),
            ],
            [
                'rate' => 170.5,
                'created' => now(),
            ],
        );

        $warehouse = Warehouse::query()->updateOrCreate(
            ['warehouse_cd' => 'WH-VN-01'],
            [
                'warehouse_name' => 'Kho TP.HCM',
                'country' => 'VN',
                'disabled_flag' => false,
                'deleted_flag' => false,
                'created' => now(),
            ],
        );

        $category = ProductCategory::query()->where('category_name', 'Thực phẩm chức năng')->first();
        $supplier = SupplierJp::query()->where('supplier_cd', 'JP001')->first();

        if ($category && $supplier) {
            $product = Product::query()->updateOrCreate(
                ['product_cd' => 'DEMO-001'],
                [
                    'product_category_id' => $category->id,
                    'product_name' => 'Collagen DHC Demo',
                    'product_name_jp' => 'DHC コラーゲン',
                    'supplier_id' => $supplier->id,
                    'cost_jpy' => 1188,
                    'price_vnd' => 250000,
                    'origin' => 'Nhật Bản',
                    'disabled_flag' => false,
                    'deleted_flag' => false,
                    'created' => now(),
                ],
            );

            Inventory::query()->updateOrCreate(
                ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                [
                    'quantity' => 50,
                    'reserved_qty' => 0,
                    'actual_qty' => 50,
                    'deleted_flag' => false,
                    'created' => now(),
                ],
            );
        }
    }
}
