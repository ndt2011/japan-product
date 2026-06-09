<?php

namespace Tests\Feature;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncRestockStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_updates_restock_status_by_thresholds(): void
    {
        $category = ProductCategory::query()->create([
            'category_name' => 'Cat',
            'disabled_flag' => false,
            'deleted_flag' => false,
        ]);

        $productA = Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'RST-P1',
            'product_name' => 'Restock Product A',
            'deleted_flag' => false,
        ]);

        $productB = Product::query()->create([
            'product_category_id' => $category->id,
            'product_cd' => 'RST-P2',
            'product_name' => 'Restock Product B',
            'deleted_flag' => false,
        ]);

        $warehouse = Warehouse::query()->create([
            'warehouse_cd' => 'WH-VN-01',
            'warehouse_name' => 'Kho VN',
            'country' => 'VN',
            'location_type' => 'VN',
            'deleted_flag' => false,
            'created' => now(),
        ]);

        $normal = Inventory::query()->create([
            'product_id' => $productA->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 20,
            'reserved_qty' => 0,
            'min_stock_qty' => 10,
            'restock_status' => 'LOW',
            'deleted_flag' => false,
            'created' => now(),
        ]);

        $critical = Inventory::query()->create([
            'product_id' => $productB->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 2,
            'reserved_qty' => 0,
            'min_stock_qty' => 10,
            'restock_status' => 'NORMAL',
            'deleted_flag' => false,
            'created' => now(),
        ]);

        $this->artisan('inventories:sync-restock-status')->assertSuccessful();

        $this->assertSame('NORMAL', $normal->fresh()->restock_status);
        $this->assertSame('CRITICAL', $critical->fresh()->restock_status);
    }
}
