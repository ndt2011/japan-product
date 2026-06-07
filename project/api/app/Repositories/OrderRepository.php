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
            ->with(['company', 'details.product', 'handler'])
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

    public function generateOrderNo(): string
    {
        $prefix = 'ORD-'.now()->format('Ymd');
        $latest = Order::query()
            ->where('order_no', 'like', "{$prefix}-%")
            ->orderByDesc('id')
            ->value('order_no');

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    private function baseQuery(array $filters): Builder
    {
        $query = Order::query()
            ->active()
            ->select('orders.*')
            ->with(['company']);

        if (! empty($filters['company_vn_id'])) {
            $query->where('company_vn_id', $filters['company_vn_id']);
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
