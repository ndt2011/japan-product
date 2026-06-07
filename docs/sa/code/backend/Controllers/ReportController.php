<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // ─── GET /reports/inventory ──────────────────────────────────────────────
    // Tồn kho hiện tại theo kho + sản phẩm
    public function inventory(Request $request): JsonResponse|Response
    {
        $request->validate([
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'category_id'  => 'nullable|integer',
            'export'       => 'nullable|in:csv',
        ]);

        $rows = DB::table('inventories as inv')
            ->join('products as p',   'p.id',  '=', 'inv.product_id')
            ->join('warehouses as w',  'w.id',  '=', 'inv.warehouse_id')
            ->leftJoin('product_categories as pc', 'pc.id', '=', 'p.category_id')
            ->where('inv.deleted_flag', 0)
            ->where('p.deleted_flag', 0)
            ->when($request->warehouse_id, fn($q, $id) => $q->where('inv.warehouse_id', $id))
            ->when($request->category_id,  fn($q, $id) => $q->where('p.category_id', $id))
            ->select(
                'w.warehouse_name',
                'p.product_cd',
                'p.name_jp',
                'pc.category_name',
                'inv.quantity',
                'p.unit_price_vnd',
                DB::raw('inv.quantity * p.unit_price_vnd as total_value_vnd')
            )
            ->orderBy('w.warehouse_name')
            ->orderBy('p.product_cd')
            ->get();

        if ($request->export === 'csv') {
            return $this->exportCsv($rows, [
                'Kho', 'Mã SP', 'Tên SP (JP)', 'Danh mục', 'Tồn kho', 'Đơn giá (VND)', 'Tổng giá trị',
            ], 'inventory_' . now()->format('Ymd') . '.csv');
        }

        return response()->json(['success' => true, 'data' => $rows]);
    }

    // ─── GET /reports/stock-movements ────────────────────────────────────────
    // Lịch sử nhập/xuất/kiểm kê kho
    public function stockMovements(Request $request): JsonResponse|Response
    {
        $request->validate([
            'warehouse_id'   => 'nullable|integer',
            'product_id'     => 'nullable|integer',
            'movement_type'  => 'nullable|in:IN,OUT,ADJUST',
            'date_from'      => 'nullable|date',
            'date_to'        => 'nullable|date|after_or_equal:date_from',
            'export'         => 'nullable|in:csv',
        ]);

        $rows = DB::table('stock_movements as sm')
            ->join('products as p',   'p.id', '=', 'sm.product_id')
            ->join('warehouses as w', 'w.id', '=', 'sm.warehouse_id')
            ->where('p.deleted_flag', 0)
            ->when($request->warehouse_id,  fn($q, $id)   => $q->where('sm.warehouse_id', $id))
            ->when($request->product_id,    fn($q, $id)   => $q->where('sm.product_id', $id))
            ->when($request->movement_type, fn($q, $type) => $q->where('sm.movement_type', $type))
            ->when($request->date_from,     fn($q, $d)    => $q->whereDate('sm.created', '>=', $d))
            ->when($request->date_to,       fn($q, $d)    => $q->whereDate('sm.created', '<=', $d))
            ->select(
                'sm.created',
                'w.warehouse_name',
                'p.product_cd',
                'p.name_jp',
                'sm.movement_type',
                'sm.quantity',
                'sm.quantity_before',
                'sm.quantity_after',
                'sm.reference_type',
                'sm.note'
            )
            ->orderByDesc('sm.created')
            ->paginate($request->per_page ?? 50);

        if ($request->export === 'csv') {
            return $this->exportCsv($rows->items(), [
                'Ngày', 'Kho', 'Mã SP', 'Tên SP', 'Loại', 'SL', 'Trước', 'Sau', 'Nguồn', 'Ghi chú',
            ], 'stock_movements_' . now()->format('Ymd') . '.csv');
        }

        return response()->json(['success' => true, 'data' => $rows]);
    }

    // ─── GET /reports/orders ─────────────────────────────────────────────────
    // Báo cáo đơn hàng — admin thấy tất cả, company chỉ thấy của mình
    public function orders(Request $request): JsonResponse|Response
    {
        $user = $request->user();

        $request->validate([
            'status'       => 'nullable|in:DRAFT,PENDING,CONFIRMED,PROCESSING,DELIVERED,CANCELLED',
            'company_vn_id'=> 'nullable|integer',
            'branch_id'    => 'nullable|integer',
            'date_from'    => 'nullable|date',
            'date_to'      => 'nullable|date|after_or_equal:date_from',
            'export'       => 'nullable|in:csv',
        ]);

        $query = DB::table('orders as o')
            ->leftJoin('companies_vn as c',  'c.id', '=', 'o.company_vn_id')
            ->leftJoin('branches as b',       'b.id', '=', 'o.branch_id')
            ->leftJoin('admins as a',         'a.id', '=', 'o.handler_admin_id')
            ->where('o.deleted_flag', 0)
            ->when($request->status,        fn($q, $s)  => $q->where('o.status', $s))
            ->when($request->date_from,     fn($q, $d)  => $q->whereDate('o.created', '>=', $d))
            ->when($request->date_to,       fn($q, $d)  => $q->whereDate('o.created', '<=', $d));

        // Filter theo role
        if ($user->user_type === 'company_vn') {
            $query->where('o.company_vn_id', $user->id);
        } elseif (str_starts_with($user->user_type, 'branch_')) {
            $query->where('o.branch_id', $user->branch_id);
        } else {
            // Admin có thể filter thêm
            $query
                ->when($request->company_vn_id, fn($q, $id) => $q->where('o.company_vn_id', $id))
                ->when($request->branch_id,      fn($q, $id) => $q->where('o.branch_id', $id));
        }

        $rows = $query->select(
            'o.id as order_id',
            'o.created as order_date',
            'o.status',
            'c.company_name',
            'b.branch_name',
            DB::raw('(SELECT SUM(od.amount_vnd) FROM order_details od WHERE od.order_id = o.id AND od.deleted_flag = 0) as total_amount_vnd'),
            'a.full_name as handler_name'
        )
        ->orderByDesc('o.created')
        ->paginate($request->per_page ?? 50);

        if ($request->export === 'csv') {
            return $this->exportCsv($rows->items(), [
                'Mã đơn', 'Ngày đặt', 'Trạng thái', 'Công ty VN', 'Chi nhánh', 'Tổng tiền (VND)', 'Người xử lý',
            ], 'orders_' . now()->format('Ymd') . '.csv');
        }

        return response()->json(['success' => true, 'data' => $rows]);
    }

    // ─── GET /reports/revenue ────────────────────────────────────────────────
    // Doanh thu theo tháng (admin only)
    public function revenue(Request $request): JsonResponse|Response
    {
        $request->validate([
            'year'   => 'nullable|integer|min:2020|max:2099',
            'export' => 'nullable|in:csv',
        ]);

        $year = $request->year ?? now()->year;

        $monthly = DB::table('orders as o')
            ->join('order_details as od', 'od.order_id', '=', 'o.id')
            ->where('o.deleted_flag', 0)
            ->where('od.deleted_flag', 0)
            ->where('o.status', 'DELIVERED')
            ->whereYear('o.created', $year)
            ->groupBy(DB::raw('MONTH(o.created)'))
            ->select(
                DB::raw('MONTH(o.created) as month'),
                DB::raw('COUNT(DISTINCT o.id) as order_count'),
                DB::raw('SUM(od.amount_vnd) as revenue_vnd'),
                DB::raw('SUM(od.quantity) as total_quantity')
            )
            ->orderBy('month')
            ->get();

        // Top sản phẩm trong năm
        $topProducts = DB::table('order_details as od')
            ->join('orders as o',   'o.id',  '=', 'od.order_id')
            ->join('products as p', 'p.id',  '=', 'od.product_id')
            ->where('o.deleted_flag', 0)
            ->where('od.deleted_flag', 0)
            ->where('o.status', 'DELIVERED')
            ->whereYear('o.created', $year)
            ->groupBy('p.id', 'p.product_cd', 'p.name_jp')
            ->select(
                'p.product_cd',
                'p.name_jp',
                DB::raw('SUM(od.quantity) as total_quantity'),
                DB::raw('SUM(od.amount_vnd) as total_revenue_vnd')
            )
            ->orderByDesc('total_revenue_vnd')
            ->limit(10)
            ->get();

        $data = [
            'year'         => $year,
            'monthly'      => $monthly,
            'top_products' => $topProducts,
            'total_revenue'=> $monthly->sum('revenue_vnd'),
        ];

        if ($request->export === 'csv') {
            return $this->exportCsv($monthly, [
                'Tháng', 'Số đơn', 'Doanh thu (VND)', 'Tổng SL',
            ], "revenue_{$year}.csv");
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ─── Helper: export CSV với UTF-8 BOM (Excel đọc được tiếng Việt) ────────
    private function exportCsv(iterable $rows, array $headers, string $filename): Response
    {
        $callback = function () use ($rows, $headers) {
            $handle = fopen('php://output', 'w');

            // BOM cho Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header row
            fputcsv($handle, $headers);

            // Data rows
            foreach ($rows as $row) {
                fputcsv($handle, (array) $row);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
