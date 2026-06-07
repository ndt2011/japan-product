<?php

namespace App\Repositories;

use App\Models\BatchOrderItem;
use App\Models\Order;
use App\Models\ShipmentBatch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ShipmentBatchRepository
{
    /** @var list<string> */
    public const STATUS_FLOW = [
        'PREPARING',
        'CUSTOMS_JP',
        'IN_TRANSIT',
        'CUSTOMS_VN',
        'DELIVERED',
    ];

    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->orderByDesc('shipment_batches.id')
            ->paginate($perPage);
    }

    public function findDetail(int $id): ?ShipmentBatch
    {
        return ShipmentBatch::query()
            ->active()
            ->with(['creator', 'items.order.company'])
            ->find($id);
    }

    public function create(array $data): ShipmentBatch
    {
        return ShipmentBatch::query()->create($data);
    }

    public function update(ShipmentBatch $batch, array $data): ShipmentBatch
    {
        $batch->update($data);

        return $batch->fresh(['creator', 'items.order.company']);
    }

    public function generateBatchNo(): string
    {
        $prefix = 'BAT-'.now()->format('Ymd');
        $latest = ShipmentBatch::query()
            ->where('batch_no', 'like', "{$prefix}-%")
            ->orderByDesc('id')
            ->value('batch_no');

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    public function availableOrders(): Collection
    {
        $assignedOrderIds = BatchOrderItem::query()
            ->whereHas('batch', fn (Builder $q) => $q->active()->where('status', '!=', 'DELIVERED'))
            ->pluck('order_id');

        return Order::query()
            ->active()
            ->where('status', 'CONFIRMED')
            ->whereNotIn('id', $assignedOrderIds)
            ->with('company')
            ->orderByDesc('id')
            ->get();
    }

    public function orderInActiveBatch(int $orderId): bool
    {
        return BatchOrderItem::query()
            ->where('order_id', $orderId)
            ->whereHas('batch', fn (Builder $q) => $q->active()->where('status', '!=', 'DELIVERED'))
            ->exists();
    }

    private function baseQuery(array $filters): Builder
    {
        $query = ShipmentBatch::query()
            ->active()
            ->with(['creator'])
            ->withCount('items');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('batch_no', 'like', "%{$search}%")
                    ->orWhere('batch_name', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['company_vn_id'])) {
            $companyId = (int) $filters['company_vn_id'];
            $query->whereHas('items.order', fn (Builder $q) => $q->where('company_vn_id', $companyId));
        }

        return $query;
    }
}
