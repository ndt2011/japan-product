<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\StockMovement;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function inventory(Request $request): JsonResponse
    {
        $query = Inventory::query()
            ->join('products', 'inventories.product_id', '=', 'products.id')
            ->join('warehouses', 'inventories.warehouse_id', '=', 'warehouses.id')
            ->leftJoin('product_categories', 'products.product_category_id', '=', 'product_categories.id')
            ->leftJoin('suppliers_jp', 'products.supplier_id', '=', 'suppliers_jp.id')
            ->where('products.deleted_flag', false)
            ->where('inventories.deleted_flag', false)
            ->select([
                'products.product_cd',
                'products.product_name',
                'product_categories.category_name',
                'suppliers_jp.supplier_name',
                'warehouses.warehouse_name',
                'inventories.quantity',
                'inventories.reserved_qty',
                'inventories.actual_qty',
                'inventories.last_check_date',
                'products.price_vnd',
                DB::raw('(inventories.quantity - inventories.reserved_qty) as available_qty'),
                DB::raw('(inventories.quantity * products.price_vnd) as total_value_vnd'),
            ]);

        if ($warehouseId = $request->input('warehouse_id')) {
            $query->where('inventories.warehouse_id', $warehouseId);
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('products.product_category_id', $categoryId);
        }

        if ($request->boolean('low_stock_only')) {
            $query->whereRaw('(inventories.quantity - inventories.reserved_qty) < 10');
        }

        $items = $query->get()->map(function ($row) {
            $row->is_low_stock = (int) $row->available_qty < 10;

            return $row;
        });

        return ApiResponse::success([
            'generated_at' => now()->toIso8601String(),
            'summary' => [
                'total_products' => $items->count(),
                'total_quantity' => (int) $items->sum('quantity'),
                'low_stock_count' => $items->filter(fn ($i) => (int) $i->available_qty < 10)->count(),
                'warehouses' => $items->pluck('warehouse_name')->unique()->count(),
            ],
            'items' => $items,
        ], 'M1100');
    }

    public function stockMovements(Request $request): JsonResponse
    {
        $query = StockMovement::query()
            ->with(['product', 'warehouse'])
            ->orderByDesc('created');

        if ($warehouseId = $request->input('warehouse_id')) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($productId = $request->input('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($movementType = $request->input('movement_type')) {
            $query->where('movement_type', $movementType);
        }

        if ($from = $request->input('from_date')) {
            $query->whereDate('created', '>=', $from);
        }

        if ($to = $request->input('to_date')) {
            $query->whereDate('created', '<=', $to);
        }

        $all = (clone $query)->get(['movement_type', 'quantity']);
        $summary = [
            'total_in' => (int) $all->where('movement_type', 'IN')->sum('quantity'),
            'total_out' => (int) $all->where('movement_type', 'OUT')->sum('quantity'),
            'total_adjust' => (int) $all->where('movement_type', 'ADJUST')->sum('quantity'),
            'net_change' => (int) $all->where('movement_type', 'IN')->sum('quantity')
                - (int) $all->where('movement_type', 'OUT')->sum('quantity'),
        ];

        $paginator = $query->paginate(min((int) $request->input('per_page', 50), 100));

        return ApiResponse::success([
            'summary' => $summary,
            'items' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'M1100');
    }

    public function orders(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        $query = Order::query()
            ->active()
            ->with(['company', 'details'])
            ->orderByDesc('created');

        if ($auth['type'] === 'company') {
            $query->where('company_vn_id', $auth['id']);
        } elseif ($companyId = $request->input('company_id')) {
            $query->where('company_vn_id', $companyId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($from = $request->input('from_date')) {
            $query->whereDate('created', '>=', $from);
        }

        if ($to = $request->input('to_date')) {
            $query->whereDate('created', '<=', $to);
        }

        $orders = $query->get();

        $items = $orders->map(function (Order $order) {
            $totalQty = (int) $order->details->sum('quantity');
            $totalValue = (int) $order->details->sum(fn ($d) => (int) $d->quantity * (int) ($d->price_vnd ?? 0));

            return [
                'order_no' => $order->order_no,
                'company_name' => $order->company?->company_name,
                'status' => $order->status,
                'order_date' => $order->created?->format('Y-m-d'),
                'items_count' => $order->details->count(),
                'total_qty' => $totalQty,
                'total_value_vnd' => $totalValue,
                'exchange_rate_jpy' => $order->exchange_rate_jpy,
            ];
        });

        $byStatus = $orders->groupBy('status')->map->count();

        return ApiResponse::success([
            'summary' => [
                'total_orders' => $orders->count(),
                'by_status' => $byStatus,
                'total_value_vnd' => (int) $items->sum('total_value_vnd'),
            ],
            'items' => $items->values(),
        ], 'M1100');
    }

    public function revenue(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');
        $format = $period === 'yearly' ? '%Y' : ($period === 'daily' ? '%Y-%m-%d' : '%Y-%m');

        $query = Order::query()
            ->active()
            ->whereIn('status', ['DELIVERED', 'CONFIRMED', 'PROCESSING', 'SHIPPED']);

        if ($from = $request->input('from_date')) {
            $query->whereDate('created', '>=', $from);
        }

        if ($to = $request->input('to_date')) {
            $query->whereDate('created', '<=', $to);
        }

        $rows = $query
            ->with('details')
            ->get()
            ->groupBy(fn (Order $o) => $o->created?->format(str_replace('%', '', $format)) ?? 'unknown');

        $items = $rows->map(function ($group, $label) {
            $delivered = $group->where('status', 'DELIVERED');

            return [
                'period_label' => $label,
                'orders_count' => $group->count(),
                'total_value_vnd' => (int) $group->sum(
                    fn (Order $o) => $o->details->sum(fn ($d) => (int) $d->quantity * (int) ($d->price_vnd ?? 0)),
                ),
                'delivered_count' => $delivered->count(),
                'delivered_value_vnd' => (int) $delivered->sum(
                    fn (Order $o) => $o->details->sum(fn ($d) => (int) $d->quantity * (int) ($d->price_vnd ?? 0)),
                ),
            ];
        })->values();

        return ApiResponse::success([
            'period' => $period,
            'items' => $items,
        ], 'M1100');
    }

    /**
     * GET /reports/profit — Báo cáo lợi nhuận Admin
     * spec: docs/sa/amendments/invoice-payment.md § 5
     *
     * Query params:
     *   date_from (Y-m-d), date_to (Y-m-d), company_id (optional)
     */
    public function profit(Request $request): JsonResponse
    {
        $from      = $request->input('date_from');
        $to        = $request->input('date_to');
        $companyId = $request->input('company_id');

        $orders = $this->completedOrdersForProfit($from, $to, $companyId);

        $summary = [
            'total_revenue_vnd'     => 0,
            'total_cost_vnd'        => 0,
            'gross_profit_vnd'      => 0,
            'total_other_costs_vnd' => 0,
            'net_profit_vnd'        => 0,
            'profit_margin_pct'     => 0,
            'order_count'           => $orders->count(),
        ];

        $byOrder = [];

        foreach ($orders as $order) {
            $orderProfit = $this->orderProfitTotals($order);

            $summary['total_revenue_vnd']      += $orderProfit['revenue_vnd'];
            $summary['total_cost_vnd']          += $orderProfit['cost_vnd'];
            $summary['gross_profit_vnd']        += $orderProfit['gross_profit_vnd'];
            $summary['total_other_costs_vnd']   += $orderProfit['other_costs_vnd'];
            $summary['net_profit_vnd']          += $orderProfit['net_profit_vnd'];

            $byOrder[] = [
                'order_id'         => $order->id,
                'order_no'         => $order->order_no,
                'completed_at'     => $order->completed_at?->toDateString(),
                'revenue_vnd'      => $orderProfit['revenue_vnd'],
                'cost_vnd'         => $orderProfit['cost_vnd'],
                'gross_profit_vnd' => $orderProfit['gross_profit_vnd'],
                'other_costs_vnd'  => $orderProfit['other_costs_vnd'],
                'net_profit_vnd'   => $orderProfit['net_profit_vnd'],
            ];
        }

        if ($summary['total_revenue_vnd'] > 0) {
            $summary['profit_margin_pct'] = round(
                $summary['net_profit_vnd'] / $summary['total_revenue_vnd'] * 100,
                2
            );
        }

        return ApiResponse::success([
            'filters'  => compact('from', 'to', 'companyId'),
            'summary'  => $summary,
            'by_order' => $byOrder,
        ]);
    }

    /**
     * GET /reports/profit/by-product — Lợi nhuận theo sản phẩm (top/bottom)
     * spec: docs/sa/amendments/invoice-payment.md § 5
     */
    public function profitByProduct(Request $request): JsonResponse
    {
        $from      = $request->input('date_from');
        $to        = $request->input('date_to');
        $companyId = $request->input('company_id');
        $limit     = min(max((int) $request->input('limit', 20), 1), 100);

        $orders = $this->completedOrdersForProfit($from, $to, $companyId);
        $byProduct = [];

        foreach ($orders as $order) {
            $lockedRate  = (float) ($order->exchange_rate ?? 0);
            $otherCosts  = (int) ($order->costs?->sum('amount_vnd') ?? 0);
            $orderRev    = 0;
            $lineMetrics = [];

            foreach ($order->details as $detail) {
                $line = $this->detailProfitMetrics($detail, $lockedRate);
                $orderRev += $line['revenue_vnd'];
                $lineMetrics[] = $line;
            }

            foreach ($lineMetrics as $line) {
                $pid = $line['product_id'];
                $allocatedOther = $orderRev > 0
                    ? (int) round($otherCosts * $line['revenue_vnd'] / $orderRev)
                    : 0;
                $grossProfit = $line['revenue_vnd'] - $line['cost_vnd'];
                $netProfit   = $grossProfit - $allocatedOther;

                if (! isset($byProduct[$pid])) {
                    $byProduct[$pid] = [
                        'product_id'        => $pid,
                        'product_cd'        => $line['product_cd'],
                        'product_name'      => $line['product_name'],
                        'product_name_vi'   => $line['product_name_vi'],
                        'quantity_sold'     => 0,
                        'revenue_vnd'       => 0,
                        'cost_vnd'          => 0,
                        'gross_profit_vnd'  => 0,
                        'other_costs_vnd'   => 0,
                        'net_profit_vnd'    => 0,
                    ];
                }

                $byProduct[$pid]['quantity_sold']    += $line['quantity'];
                $byProduct[$pid]['revenue_vnd']      += $line['revenue_vnd'];
                $byProduct[$pid]['cost_vnd']         += $line['cost_vnd'];
                $byProduct[$pid]['gross_profit_vnd'] += $grossProfit;
                $byProduct[$pid]['other_costs_vnd']  += $allocatedOther;
                $byProduct[$pid]['net_profit_vnd']   += $netProfit;
            }
        }

        $items = collect($byProduct)
            ->sortByDesc('net_profit_vnd')
            ->take($limit)
            ->values()
            ->all();

        return ApiResponse::success([
            'filters' => compact('from', 'to', 'companyId'),
            'items'   => $items,
        ]);
    }

    /** @return \Illuminate\Support\Collection<int, Order> */
    private function completedOrdersForProfit(?string $from, ?string $to, mixed $companyId)
    {
        return Order::query()
            ->with(['details.product', 'costs'])
            ->where('deleted_flag', false)
            ->where('status', 'COMPLETED')
            ->when($from, fn ($q) => $q->where('completed_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('completed_at', '<=', $to.' 23:59:59'))
            ->when($companyId, fn ($q) => $q->where('company_vn_id', $companyId))
            ->get();
    }

    /** @return array{revenue_vnd: int, cost_vnd: int, gross_profit_vnd: int, other_costs_vnd: int, net_profit_vnd: int} */
    private function orderProfitTotals(Order $order): array
    {
        $lockedRate = (float) ($order->exchange_rate ?? 0);
        $revVnd     = 0;
        $costVnd    = 0;

        foreach ($order->details as $detail) {
            $line = $this->detailProfitMetrics($detail, $lockedRate);
            $revVnd  += $line['revenue_vnd'];
            $costVnd += $line['cost_vnd'];
        }

        $grossProfit = $revVnd - $costVnd;
        $otherCosts  = (int) ($order->costs?->sum('amount_vnd') ?? 0);

        return [
            'revenue_vnd'      => $revVnd,
            'cost_vnd'         => $costVnd,
            'gross_profit_vnd' => $grossProfit,
            'other_costs_vnd'  => $otherCosts,
            'net_profit_vnd'   => $grossProfit - $otherCosts,
        ];
    }

    /** @return array{product_id: int, product_cd: string, product_name: string, product_name_vi: ?string, quantity: int, revenue_vnd: int, cost_vnd: int} */
    private function detailProfitMetrics(OrderDetail $detail, float $lockedRate): array
    {
        /** @var Product|null $product */
        $product    = $detail->product;
        $sellingJpy = (float) ($product?->selling_price_jpy ?? $product?->cost_jpy ?? 0);
        $costJpy    = (float) ($product?->cost_price_jpy ?? $product?->cost_jpy ?? 0);
        $feeRate    = (float) ($product?->fee_rate ?? 0.05);
        $qty        = (int) $detail->quantity;

        return [
            'product_id'      => (int) $detail->product_id,
            'product_cd'      => (string) ($product?->product_cd ?? ''),
            'product_name'    => (string) ($product?->product_name ?? ''),
            'product_name_vi'   => $product?->product_name_vi,
            'quantity'        => $qty,
            'revenue_vnd'     => (int) round($sellingJpy * $lockedRate * (1 + $feeRate) * $qty),
            'cost_vnd'        => (int) round($costJpy * $lockedRate * $qty),
        ];
    }
}
