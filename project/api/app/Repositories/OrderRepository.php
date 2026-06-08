<?php

namespace App\Repositories;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class OrderRepository
{
    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->orderByDesc('orders.id')
            ->paginate($perPage);
    }

    public function findDetail(int $id): ?Order
    {
        return Order::query()
            ->active()
            ->with(['company', 'branch', 'details.product', 'handler'])
            ->find($id);
    }

    public function create(array $data): Order
    {
        return Order::query()->create($data);
    }

    public function update(Order $order, array $data): Order
    {
        $order->update($data);

        return $order->fresh(['company', 'details.product', 'handler']);
    }

    public function softDelete(Order $order): void
    {
        $order->update([
            'deleted_flag' => true,
            'deleted' => now(),
            'modified' => now(),
        ]);
    }

    /**
     * Sinh order_no chuẩn format: ORD-{YYYYMM}-{SEQ4}
     * Ví dụ: ORD-202606-0001
     * spec: docs/sa/amendments/product-tier-model.md § 2
     */
    public function generateOrderNo(): string
    {
        return app(\App\Services\CodeGeneratorService::class)->orderNo();
    }

    private function baseQuery(array $filters): Builder
    {
        $query = Order::query()
            ->active()
            ->select('orders.*')
            ->with(['company', 'branch']);

        if (! empty($filters['company_vn_id'])) {
            $query->where('company_vn_id', $filters['company_vn_id']);
        }

        if (! empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                    ->orWhereHas('company', fn (Builder $c) => $c->where('company_name', 'like', "%{$search}%"));
            });
        }

        return $query;
    }
}
