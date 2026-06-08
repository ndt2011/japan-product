<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Tự động hoàn tất (COMPLETED) các đơn DELIVERED_ADMIN sau 7 ngày
 * không được đại lý xác nhận nhận hàng.
 *
 * Schedule: 8h JST hàng ngày
 * Spec: docs/sa/amendments/invoice-payment.md § RULE-DEL-02
 */
class AutoCompleteDeliveredOrders extends Command
{
    protected $signature = 'orders:auto-complete
                            {--days=7 : Số ngày chờ trước khi tự hoàn tất}
                            {--dry-run : Chỉ in danh sách, không cập nhật}';

    protected $description = 'Tự động COMPLETED các đơn DELIVERED_ADMIN quá 7 ngày chưa được đại lý xác nhận';

    public function handle(): int
    {
        $days      = (int) $this->option('days');
        $dryRun    = $this->option('dry-run');
        $threshold = Carbon::now()->subDays($days);

        $query = Order::query()
            ->where('status', 'DELIVERED_ADMIN')
            ->whereNotNull('delivered_admin_at')
            ->where('delivered_admin_at', '<=', $threshold)
            ->where('deleted_flag', false);

        $count = $query->count();

        if ($count === 0) {
            $this->info('[orders:auto-complete] Không có đơn nào cần tự hoàn tất.');

            return Command::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("[orders:auto-complete] --dry-run: tìm thấy {$count} đơn sẽ bị auto-complete.");
            $query->select(['id', 'delivered_admin_at'])->each(function ($o) {
                $this->line("  Order #{$o->id} — delivered_admin_at: {$o->delivered_admin_at}");
            });

            return Command::SUCCESS;
        }

        $now = now();
        $updated = $query->update([
            'status'              => 'COMPLETED',
            'delivered_client_at' => $now, // system auto-confirm
            'completed_at'        => $now,
            'modified'            => $now,
        ]);

        $this->info("[orders:auto-complete] Đã auto-complete {$updated} đơn hàng (delivered_admin_at <= {$threshold->toDateString()}).");

        return Command::SUCCESS;
    }
}
