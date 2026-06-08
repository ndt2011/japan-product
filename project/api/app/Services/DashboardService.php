<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\CompanyVn;
use App\Models\ExchangeRate;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function stats(Authenticatable $user, string $userType): array
    {
        $orderQuery = Order::query()->active();
        $this->applyOrderScope($orderQuery, $user, $userType);

        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        $ordersToday = (clone $orderQuery)->whereDate('order_date', $today)->count();
        $ordersMonth = (clone $orderQuery)->where('order_date', '>=', $monthStart)->count();

        $revenueMonth = (clone $orderQuery)
            ->where('order_date', '>=', $monthStart)
            ->whereNotIn('status', ['DRAFT', 'CANCELLED'])
            ->sum(DB::raw('CAST(total_vnd AS UNSIGNED)'));

        $ordersByStatus = (clone $orderQuery)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $topProducts = $this->topProducts($user, $userType, 5);
        $inventoryAlerts = $userType === 'admin' ? $this->inventoryAlerts(5) : [];

        // KPI: Công nợ chưa thu (Admin only) — spec: docs/sa/0-001_Dashboard.xlsx
        $outstandingDebt = 0;
        $lowStockCount   = 0;
        if ($userType === 'admin') {
            $outstandingDebt = (int) Invoice::query()
                ->whereIn('status', ['SENT', 'OVERDUE'])
                ->sum(DB::raw('CAST(total_amount AS UNSIGNED)'));

            $lowStockCount = (int) DB::table('inventories')
                ->join('products', 'inventories.product_id', '=', 'products.id')
                ->where('inventories.deleted_flag', false)
                ->where('products.deleted_flag', false)
                ->whereRaw('(inventories.quantity - inventories.reserved_qty) < 10')
                ->count();
        }

        $rate = ExchangeRate::query()
            ->where('from_currency', 'JPY')
            ->where('to_currency', 'VND')
            ->where('apply_date', '<=', $today)
            ->orderByDesc('apply_date')
            ->first();

        $payload = [
            'orders_today'         => $ordersToday,
            'orders_month'         => $ordersMonth,
            'revenue_month_vnd'    => (int) $revenueMonth,
            'outstanding_debt_vnd' => $outstandingDebt,    // invoices SENT + OVERDUE
            'low_stock_count'      => $lowStockCount,       // sản phẩm tồn kho thấp (< 10)
            'orders_by_status'     => $ordersByStatus,
            'top_products'         => $topProducts,
            'inventory_alerts'     => $inventoryAlerts,
            'exchange_rate' => [
                'jpy_vnd'    => (float) ($rate->rate ?? 170.5),
                'updated_at' => $rate?->apply_date?->toDateString(),
            ],
            'products_total' => Product::query()->active()->where('disabled_flag', false)->count(),
        ];

        if ($userType === 'admin') {
            $payload['companies_total'] = CompanyVn::query()->where('deleted_flag', false)->count();
            $payload['branches_total']  = Branch::query()->where('deleted_flag', false)->count();
        }

        return $payload;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function orderChart(Authenticatable $user, string $userType, int $days = 30): array
    {
        $from = now()->subDays($days - 1)->toDateString();
        $query = Order::query()
            ->active()
            ->where('order_date', '>=', $from)
            ->select('order_date', DB::raw('COUNT(*) as count'))
            ->groupBy('order_date')
            ->orderBy('order_date');

        $this->applyOrderScope($query, $user, $userType);

        return $query->get()
            ->map(fn ($row) => [
                'date' => $row->order_date?->toDateString() ?? (string) $row->order_date,
                'count' => (int) $row->count,
            ])
            ->all();
    }

    private function applyOrderScope($query, Authenticatable $user, string $userType): void
    {
        if ($userType === 'company') {
            $query->where('company_vn_id', $user->id);
        } elseif (str_starts_with($userType, 'branch_')) {
            $query->where('branch_id', $user->branch_id);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function topProducts(Authenticatable $user, string $userType, int $limit): array
    {
        $query = DB::table('order_details')
            ->join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('products', 'order_details.product_id', '=', 'products.id')
            ->where('orders.deleted_flag', false)
            ->where('order_details.deleted_flag', false)
            ->whereNotIn('orders.status', ['DRAFT', 'CANCELLED']);

        if ($userType === 'company') {
            $query->where('orders.company_vn_id', $user->id);
        } elseif (str_starts_with($userType, 'branch_')) {
            $query->where('orders.branch_id', $user->branch_id);
        }

        return $query
            ->select(
                'products.id',
                'products.product_name',
                DB::raw('SUM(order_details.quantity) as order_count'),
                DB::raw('SUM(CAST(order_details.subtotal_vnd AS UNSIGNED)) as revenue_vnd'),
            )
            ->groupBy('products.id', 'products.product_name')
            ->orderByDesc('order_count')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->product_name,
                'order_count' => (int) $row->order_count,
                'revenue_vnd' => (int) $row->revenue_vnd,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function inventoryAlerts(int $limit): array
    {
        return DB::table('inventories')
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->where('inventories.deleted_flag', false)
            ->where('products.deleted_flag', false)
            ->select(
                'products.id as product_id',
                'products.product_name as name',
                'inventories.quantity',
                'inventories.reserved_qty',
                DB::raw('(inventories.quantity - inventories.reserved_qty) as available_qty'),
            )
            ->whereRaw('(inventories.quantity - inventories.reserved_qty) < 10')
            ->orderByRaw('(inventories.quantity - inventories.reserved_qty)')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => (int) $row->product_id,
                'name' => $row->name,
                'quantity' => (int) $row->quantity,
                'available_qty' => (int) $row->available_qty,
                'min_threshold' => 10,
            ])
            ->all();
    }
}
