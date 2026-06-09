<?php

namespace App\Console\Commands;

use App\Services\InventoryService;
use Illuminate\Console\Command;

/**
 * Kiểm tra tồn kho hàng ngày → cập nhật restock_status (NORMAL/LOW/CRITICAL).
 *
 * Schedule: 7h JST hàng ngày
 * Spec: BE-V3-018 · docs/ba/BRD.md § Inventory
 */
class SyncRestockStatus extends Command
{
    protected $signature = 'inventories:sync-restock-status
                            {--dry-run : Chỉ đếm, không ghi DB}';

    protected $description = 'Cập nhật restock_status theo available_qty và min_stock_qty';

    public function handle(InventoryService $inventoryService): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $updated = $inventoryService->recalculateAllRestockStatuses($dryRun);

        $prefix = $dryRun ? '[dry-run] ' : '';
        $this->info("{$prefix}inventories:sync-restock-status — cập nhật {$updated} bản ghi.");

        return Command::SUCCESS;
    }
}
