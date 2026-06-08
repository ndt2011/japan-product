<?php

namespace App\Services;

use App\Exceptions\OrderException;
use App\Models\Admin;
use App\Models\Order;
use App\Models\OrderCost;
use Illuminate\Support\Collection;

class OrderCostService
{
    public function list(int $orderId): Collection
    {
        $this->findOrder($orderId);

        return OrderCost::query()
            ->where('order_id', $orderId)
            ->orderByDesc('created')
            ->orderByDesc('id')
            ->get();
    }

    public function store(int $orderId, array $data, Admin $admin): OrderCost
    {
        $this->findOrder($orderId);

        return OrderCost::query()->create([
            'order_id'         => $orderId,
            'batch_id'         => $data['batch_id'] ?? null,
            'cost_type'        => $data['cost_type'] ?? 'other',
            'amount_vnd'       => (int) ($data['amount_vnd'] ?? 0),
            'note'             => $data['note'] ?? null,
            'created'          => now(),
            'created_user_id'  => $admin->id,
        ]);
    }

    public function destroy(int $orderId, int $costId): void
    {
        $this->findOrder($orderId);

        $cost = OrderCost::query()
            ->where('order_id', $orderId)
            ->where('id', $costId)
            ->first();

        if (! $cost) {
            throw new OrderException('M0002', 404);
        }

        $cost->delete();
    }

    private function findOrder(int $orderId): Order
    {
        $order = Order::query()
            ->where('id', $orderId)
            ->where('deleted_flag', false)
            ->first();

        if (! $order) {
            throw new OrderException('M0002', 404);
        }

        return $order;
    }
}
