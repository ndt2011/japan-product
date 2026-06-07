<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // GET /dashboard/stats
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Inventory alerts (admin only)
        $inventoryAlerts = [];
        if ($user->user_type === 'admin') {
            $inventoryAlerts = DB::table('inventories as inv')
                ->join('products as p', 'p.id', '=', 'inv.product_id')
                ->where('inv.deleted_flag', 0)
                ->where('p.deleted_flag', 0)
                ->whereRaw('inv.quantity <= inv.min_threshold')
                ->select('p.id as product_id', 'p.name_jp', 'inv.quantity', 'inv.min_threshold')
                ->limit(5)
                ->get();
        }

        // Orders today + this month
        $ordersQuery = DB::table('orders')->where('deleted_flag', 0);
        if ($user->user_type === 'company_vn') {
            $ordersQuery->where('company_vn_id', $user->id);
        } elseif (str_starts_with($user->user_type, 'branch_')) {
            $ordersQuery->where('branch_id', $user->branch_id);
        }

        $ordersToday = (clone $ordersQuery)->whereDate('created', today())->count();
        $ordersMonth = (clone $ordersQuery)->whereMonth('created', now()->month)->whereYear('created', now()->year)->count();

        // Revenue this month (DELIVERED orders only, admin/company)
        $revenueMonth = 0;
        if (in_array($user->user_type, ['admin', 'company_vn'])) {
            $revenueQuery = DB::table('order_details as od')
                ->join('orders as o', 'o.id', '=', 'od.order_id')
                ->where('od.deleted_flag', 0)
                ->where('o.deleted_flag', 0)
                ->where('o.status', 'DELIVERED')
                ->whereMonth('o.created', now()->month)
                ->whereYear('o.created', now()->year);

            if ($user->user_type === 'company_vn') {
                $revenueQuery->where('o.company_vn_id', $user->id);
            }

            $revenueMonth = $revenueQuery->sum('od.amount_vnd');
        }

        // Orders by status
        $statusCounts = (clone $ordersQuery)
            ->groupBy('status')
            ->pluck(DB::raw('COUNT(*) as count'), 'status');

        // Top 5 products this month (admin)
        $topProducts = [];
        if ($user->user_type === 'admin') {
            $topProducts = DB::table('order_details as od')
                ->join('orders as o',   'o.id',  '=', 'od.order_id')
                ->join('products as p', 'p.id',  '=', 'od.product_id')
                ->where('od.deleted_flag', 0)
                ->where('o.deleted_flag', 0)
                ->whereMonth('o.created', now()->month)
                ->whereYear('o.created', now()->year)
                ->groupBy('p.id', 'p.name_jp', 'p.product_cd')
                ->select(
                    'p.id',
                    'p.product_cd',
                    'p.name_jp',
                    DB::raw('SUM(od.quantity) as order_count'),
                    DB::raw('SUM(od.amount_vnd) as revenue')
                )
                ->orderByDesc('revenue')
                ->limit(5)
                ->get();
        }

        // Exchange rate
        $exchangeRate = DB::table('exchange_rates')
            ->orderByDesc('created')
            ->select('jpy_vnd', 'created as updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'orders_today'          => $ordersToday,
                'orders_month'          => $ordersMonth,
                'revenue_month_vnd'     => (int) $revenueMonth,
                'orders_by_status'      => $statusCounts,
                'top_products'          => $topProducts,
                'inventory_alerts'      => $inventoryAlerts,
                'exchange_rate_current' => $exchangeRate,
            ],
        ]);
    }

    // GET /dashboard/charts/orders?period=30d
    public function ordersChart(Request $request): JsonResponse
    {
        $days = (int) str_replace('d', '', $request->period ?? '30d');
        $days = min(max($days, 7), 90);

        $user = $request->user();

        $query = DB::table('orders')
            ->where('deleted_flag', 0)
            ->where('created', '>=', now()->subDays($days))
            ->groupBy(DB::raw('DATE(created)'))
            ->select(DB::raw('DATE(created) as date'), DB::raw('COUNT(*) as count'));

        if ($user->user_type === 'company_vn') {
            $query->where('company_vn_id', $user->id);
        } elseif (str_starts_with($user->user_type, 'branch_')) {
            $query->where('branch_id', $user->branch_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('date')->get(),
        ]);
    }

    // GET /dashboard/charts/revenue?period=30d
    public function revenueChart(Request $request): JsonResponse
    {
        $days = (int) str_replace('d', '', $request->period ?? '30d');
        $days = min(max($days, 7), 90);

        $data = DB::table('order_details as od')
            ->join('orders as o', 'o.id', '=', 'od.order_id')
            ->where('od.deleted_flag', 0)
            ->where('o.deleted_flag', 0)
            ->where('o.status', 'DELIVERED')
            ->where('o.created', '>=', now()->subDays($days))
            ->groupBy(DB::raw('DATE(o.created)'))
            ->select(
                DB::raw('DATE(o.created) as date'),
                DB::raw('SUM(od.amount_vnd) as revenue')
            )
            ->orderBy('date')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }
}
