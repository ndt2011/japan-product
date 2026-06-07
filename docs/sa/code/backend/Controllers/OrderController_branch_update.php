<?php

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PATCH: Cập nhật OrderController hiện tại
 * Thêm các method sau vào OrderController.php đang có
 * ─────────────────────────────────────────────────────────────────────────────
 */

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\ExchangeRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // ─── Cập nhật method store() ─────────────────────────────────────────────
    // Thêm logic auto-set branch_id khi BranchUser tạo đơn
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'items'               => 'required|array|min:1',
            'items.*.product_id'  => 'required|integer|exists:products,id',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.unit_price_vnd' => 'nullable|numeric|min:0',
            'note'                => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($user, $validated) {
            // Lấy exchange rate hiện tại
            $exchangeRate = ExchangeRate::orderByDesc('created')->first();

            // Auto-set company_vn_id và branch_id tuỳ loại user
            $companyVnId = null;
            $branchId    = null;

            if ($user->user_type === 'company_vn') {
                $companyVnId = $user->id;
            } elseif (str_starts_with($user->user_type, 'branch_')) {
                $branchId = $user->branch_id;
                // Branch user đặt hàng thay mặt chi nhánh (không có company_vn_id)
            }

            $order = Order::create([
                'company_vn_id'    => $companyVnId,
                'branch_id'        => $branchId,
                'status'           => 'DRAFT',
                'exchange_rate_id' => $exchangeRate?->id,
                'note'             => $validated['note'] ?? null,
                'deleted_flag'     => 0,
                'created'          => now(),
                'created_user_id'  => $user->id,
            ]);

            // Tạo order details
            foreach ($validated['items'] as $item) {
                $product = \App\Models\Product::find($item['product_id']);

                // Tính giá tự động nếu không truyền lên (và có đủ dữ liệu)
                $price = $item['unit_price_vnd'] ?? null;
                if (!$price && $product?->cost_jpy && $exchangeRate) {
                    $rate    = $exchangeRate->jpy_vnd;
                    $tax     = $product->tax_rate ?? 0.10;
                    $markup  = $product->markup_rate ?? 0.20;
                    $price   = $product->cost_jpy * $rate * (1 + $tax) * (1 + $markup);
                }

                OrderDetail::create([
                    'order_id'      => $order->id,
                    'product_id'    => $item['product_id'],
                    'quantity'      => $item['quantity'],
                    'unit_price_vnd'=> $price,
                    'amount_vnd'    => ($price ?? 0) * $item['quantity'],
                    'deleted_flag'  => 0,
                    'created'       => now(),
                    'created_user_id' => $user->id,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'M3001',
                'data'    => $order->load('orderDetails.product'),
            ], 201);
        });
    }

    // ─── Method mới: đơn hàng của chi nhánh ──────────────────────────────────
    // GET /branch/orders
    public function branchOrders(Request $request): JsonResponse
    {
        $user = $request->user(); // BranchUser

        $orders = Order::with(['orderDetails.product'])
            ->where('branch_id', $user->branch_id)
            ->where('deleted_flag', 0)
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderByDesc('created')
            ->paginate($request->per_page ?? 20);

        return response()->json(['success' => true, 'data' => $orders]);
    }

    // ─── Method mới: thống kê sản phẩm theo chi nhánh (admin only) ───────────
    // GET /products/{id}/branch-stats
    public function branchStats(int $productId): JsonResponse
    {
        $stats = DB::table('order_details as od')
            ->join('orders as o', 'od.order_id', '=', 'o.id')
            ->join('branches as b', 'o.branch_id', '=', 'b.id')
            ->where('od.product_id', $productId)
            ->where('od.deleted_flag', 0)
            ->where('o.deleted_flag', 0)
            ->whereNotNull('o.branch_id')
            ->groupBy('b.id', 'b.branch_name', 'b.region')
            ->select(
                'b.id as branch_id',
                'b.branch_name',
                'b.region',
                DB::raw('SUM(od.quantity) as total_ordered'),
                DB::raw('COUNT(DISTINCT o.id) as order_count'),
                DB::raw('SUM(od.amount_vnd) as total_amount_vnd')
            )
            ->get();

        return response()->json(['success' => true, 'data' => $stats]);
    }
}
