<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchUser;
use App\Models\CompanyVn;
use App\Models\ExchangeRate;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\OrderCost;
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
        $canViewFinancial = $this->canViewFinancial($userType);

        if ($userType === 'admin') {
            $outstandingDebt = (int) Invoice::query()
                ->whereIn('status', ['SENT', 'OVERDUE'])
                ->sum(DB::raw('CAST(total_amount AS UNSIGNED)'));

            $lowStockCount = (int) DB::table('inventories')
                ->join('products', 'inventories.product_id', '=', 'products.id')
                ->where('inventories.deleted_flag', false)
                ->where('products.deleted_flag', false)
                ->whereRaw('(inventories.quantity - inventories.reserved_qty) < COALESCE(inventories.min_stock_qty, 10)')
                ->count();
        } elseif ($userType === 'company') {
            $outstandingDebt = (int) Invoice::query()
                ->where('company_vn_id', $user->id)
                ->whereIn('status', ['SENT', 'OVERDUE'])
                ->sum(DB::raw('CAST(total_amount AS UNSIGNED)'));
        } elseif (str_starts_with($userType, 'branch_') && $user instanceof BranchUser) {
            $outstandingDebt = (int) Invoice::query()
                ->where('branch_id', $user->branch_id)
                ->whereIn('status', ['SENT', 'OVERDUE'])
                ->sum(DB::raw('CAST(total_amount AS UNSIGNED)'));
        }

        $rate = ExchangeRate::query()
            ->where('from_currency', 'JPY')
            ->where('to_currency', 'VND')
            ->where('apply_date', '<=', $today)
            ->orderByDesc('apply_date')
            ->first();

        $payload = [
            'can_view_financial'   => $canViewFinancial,
            'orders_today'         => $ordersToday,
            'orders_month'         => $ordersMonth,
            'revenue_month_vnd'    => $canViewFinancial ? (int) $revenueMonth : 0,
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

    /**
     * @return array<string, mixed>
     */
    public function revenue(Authenticatable $user, string $userType, int $year, int $month): array
    {
        if (! $this->canViewFinancial($userType)) {
            return ['year' => $year, 'month' => $month, 'restricted' => true];
        }

        $start = sprintf('%04d-%02d-01', $year, $month);
        $end = date('Y-m-t', strtotime($start));

        $query = Order::query()
            ->active()
            ->whereBetween('order_date', [$start, $end])
            ->whereNotIn('status', ['DRAFT', 'CANCELLED']);

        $this->applyOrderScope($query, $user, $userType);

        $revenueVnd = (int) (clone $query)->sum(DB::raw('CAST(total_vnd AS UNSIGNED)'));
        $ordersCount = (clone $query)->count();
        $completed = (clone $query)->where('status', 'COMPLETED')->count();

        $daily = (clone $query)
            ->select('order_date', DB::raw('SUM(CAST(total_vnd AS UNSIGNED)) as revenue'), DB::raw('COUNT(*) as orders'))
            ->groupBy('order_date')
            ->orderBy('order_date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->order_date?->toDateString() ?? (string) $row->order_date,
                'revenue' => (int) $row->revenue,
                'orders' => (int) $row->orders,
            ])
            ->all();

        return [
            'year' => $year,
            'month' => $month,
            'revenue_vnd' => $revenueVnd,
            'orders_count' => $ordersCount,
            'orders_completed' => $completed,
            'avg_order_value_vnd' => $ordersCount > 0 ? (int) round($revenueVnd / $ordersCount) : 0,
            'top_products' => $this->topProducts($user, $userType, 5),
            'daily_chart' => $daily,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function cashflow(Authenticatable $user, string $userType, int $year, int $fromMonth, int $toMonth): array
    {
        if (! $this->canViewFinancial($userType)) {
            return ['year' => $year, 'restricted' => true];
        }

        $monthly = [];
        $totalRevenue = 0;
        $totalCost = 0;

        for ($m = $fromMonth; $m <= $toMonth; $m++) {
            $start = sprintf('%04d-%02d-01', $year, $m);
            $end = date('Y-m-t', strtotime($start));

            $orderQuery = Order::query()
                ->active()
                ->whereBetween('order_date', [$start, $end])
                ->whereNotIn('status', ['DRAFT', 'CANCELLED']);
            $this->applyOrderScope($orderQuery, $user, $userType);

            $revenue = (int) (clone $orderQuery)->sum(DB::raw('CAST(total_vnd AS UNSIGNED)'));

            $orderIds = (clone $orderQuery)->pluck('id');
            $importCost = (int) OrderCost::query()->whereIn('order_id', $orderIds)->sum('amount_vnd');
            $grossProfit = $revenue - $importCost;

            $debt = 0;
            if ($userType === 'admin') {
                $debt = (int) Invoice::query()
                    ->whereIn('status', ['SENT', 'OVERDUE'])
                    ->whereYear('invoice_date', $year)
                    ->whereMonth('invoice_date', $m)
                    ->sum(DB::raw('CAST(total_amount AS UNSIGNED)'));
            }

            $monthly[] = [
                'month' => $m,
                'revenue' => $revenue,
                'cost_import' => $importCost,
                'gross_profit' => $grossProfit,
                'gross_margin_pct' => $revenue > 0 ? round($grossProfit / $revenue * 100, 1) : 0,
                'outstanding_debt' => $debt,
            ];

            $totalRevenue += $revenue;
            $totalCost += $importCost;
        }

        $totalProfit = $totalRevenue - $totalCost;

        return [
            'year' => $year,
            'from_month' => $fromMonth,
            'to_month' => $toMonth,
            'monthly' => $monthly,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_cost' => $totalCost,
                'total_profit' => $totalProfit,
                'avg_margin_pct' => $totalRevenue > 0 ? round($totalProfit / $totalRevenue * 100, 1) : 0,
            ],
        ];
    }

    private function canViewFinancial(string $userType): bool
    {
        return in_array($userType, ['admin', 'company', 'branch_manager'], true);
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
