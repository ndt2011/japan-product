<?php

namespace App\Services\Ai;

use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

/**
 * Học từ lịch sử đơn hàng — gợi ý SP/danh mục khách hay mua.
 *
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 11.2
 */
class AiOrderHistoryInsightService
{
    private const LOOKBACK_DAYS = 180;

    private const ACTIVE_STATUSES = [
        'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED',
        'DELIVERED_ADMIN', 'COMPLETED',
    ];

    /**
     * @return array{
     *   top_products: list<array{product_id: int, name: string, order_count: int, total_qty: int}>,
     *   top_categories: list<array{category: string, order_count: int}>,
     *   summary: string
     * }
     */
    public function insightsForUser(Authenticatable $user, string $userType): array
    {
        $orderIds = $this->orderIdsForUser($user, $userType);

        if ($orderIds === []) {
            return [
                'top_products' => [],
                'top_categories' => [],
                'summary' => '',
            ];
        }

        $topProducts = $this->topProducts($orderIds);
        $topCategories = $this->topCategories($orderIds);

        return [
            'top_products' => $topProducts,
            'top_categories' => $topCategories,
            'summary' => $this->buildSummary($topProducts, $topCategories),
        ];
    }

    /** @return list<int> */
    private function orderIdsForUser(Authenticatable $user, string $userType): array
    {
        $query = Order::query()
            ->active()
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->where('created', '>=', now()->subDays(self::LOOKBACK_DAYS));

        if ($userType === 'company') {
            $query->where('company_vn_id', $user->id);
        } elseif (str_starts_with($userType, 'branch_')) {
            $branchId = $user->branch_id ?? 0;
            if (! $branchId) {
                return [];
            }
            $query->where('branch_id', $branchId);
        } else {
            return [];
        }

        return $query->pluck('id')->all();
    }

    /**
     * @param  list<int>  $orderIds
     * @return list<array{product_id: int, name: string, order_count: int, total_qty: int}>
     */
    private function topProducts(array $orderIds): array
    {
        $rows = OrderDetail::query()
            ->select([
                'order_details.product_id',
                'products.name_vi',
                'products.product_name',
                DB::raw('COUNT(DISTINCT order_details.order_id) as order_count'),
                DB::raw('SUM(order_details.quantity) as total_qty'),
            ])
            ->join('products', 'products.id', '=', 'order_details.product_id')
            ->whereIn('order_details.order_id', $orderIds)
            ->where('order_details.deleted_flag', false)
            ->where('products.deleted_flag', false)
            ->groupBy('order_details.product_id', 'products.name_vi', 'products.product_name')
            ->orderByDesc('order_count')
            ->limit(5)
            ->get();

        return $rows->map(function ($row) {
            $name = (string) (($row->name_vi ?? '') ?: $row->product_name);

            return [
                'product_id' => (int) $row->product_id,
                'name' => $name,
                'order_count' => (int) $row->order_count,
                'total_qty' => (int) $row->total_qty,
            ];
        })->all();
    }

    /**
     * @param  list<int>  $orderIds
     * @return list<array{category: string, order_count: int}>
     */
    private function topCategories(array $orderIds): array
    {
        $rows = OrderDetail::query()
            ->select([
                'product_categories.category_name',
                DB::raw('COUNT(DISTINCT order_details.order_id) as order_count'),
            ])
            ->join('products', 'products.id', '=', 'order_details.product_id')
            ->leftJoin('product_categories', 'product_categories.id', '=', 'products.product_category_id')
            ->whereIn('order_details.order_id', $orderIds)
            ->where('order_details.deleted_flag', false)
            ->groupBy('product_categories.category_name')
            ->orderByDesc('order_count')
            ->limit(3)
            ->get();

        return $rows->map(fn ($row) => [
            'category' => (string) ($row->category_name ?: 'Khác'),
            'order_count' => (int) $row->order_count,
        ])->all();
    }

    /**
     * @param  list<array{product_id: int, name: string, order_count: int, total_qty: int}>  $topProducts
     * @param  list<array{category: string, order_count: int}>  $topCategories
     */
    private function buildSummary(array $topProducts, array $topCategories): string
    {
        if ($topProducts === [] && $topCategories === []) {
            return '';
        }

        $parts = ['Lịch sử mua hàng (6 tháng gần đây):'];

        if ($topCategories !== []) {
            $cats = collect($topCategories)
                ->map(fn ($c) => $c['category'].' ('.$c['order_count'].' đơn)')
                ->join(', ');
            $parts[] = '- Danh mục hay đặt: '.$cats;
        }

        if ($topProducts !== []) {
            $names = collect($topProducts)
                ->map(fn ($p) => $p['name'].' (×'.$p['order_count'].' đơn)')
                ->join(', ');
            $parts[] = '- Sản phẩm hay đặt: '.$names;
            $parts[] = '- Ưu tiên gợi ý SP tương tự hoặc bổ sung cho nhóm trên khi khách hỏi chung chung.';
        }

        return implode("\n", $parts);
    }
}
