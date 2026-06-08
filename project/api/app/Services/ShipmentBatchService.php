<?php

namespace App\Services;

use App\Exceptions\ShipmentBatchException;
use App\Exceptions\WarehouseException;
use App\Models\Admin;
use App\Models\BatchOrderItem;
use App\Models\CompanyVn;
use App\Models\Order;
use App\Models\ShipmentBatch;
use App\Repositories\ShipmentBatchRepository;
use App\Repositories\WarehouseRepository;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ShipmentBatchService
{
    public function __construct(
        private readonly ShipmentBatchRepository $repository,
        private readonly InventoryService $inventoryService,
        private readonly WarehouseRepository $warehouseRepository,
    ) {}

    public function list(array $filters, Authenticatable $user, string $userType): LengthAwarePaginator
    {
        if ($user instanceof CompanyVn) {
            $filters['company_vn_id'] = $user->id;
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $this->repository->paginate($filters, $perPage);
    }

    public function show(int $id, Authenticatable $user, string $userType): ShipmentBatch
    {
        $batch = $this->repository->findDetail($id);

        if (! $batch) {
            throw new ShipmentBatchException('M0002', 404);
        }

        $this->assertCanAccess($batch, $user, $userType);

        return $batch;
    }

    public function availableOrders(string $userType): Collection
    {
        if ($userType !== 'admin') {
            throw new ShipmentBatchException('M0507', 403);
        }

        return $this->repository->availableOrders();
    }

    public function store(array $data, Admin $admin): ShipmentBatch
    {
        $orderIds = array_values(array_unique(array_map('intval', $data['order_ids'] ?? [])));

        if (count($orderIds) < 1) {
            throw new ShipmentBatchException('M0503', 422);
        }

        return DB::transaction(function () use ($data, $admin, $orderIds) {
            $this->validateOrdersForBatch($orderIds);

            $batch = $this->repository->create([
                'batch_no' => $this->repository->generateBatchNo(),
                'batch_name' => $data['batch_name'],
                'status' => 'PREPARING',
                'logistics_partner' => $data['logistics_partner'] ?? null,
                'tracking_number' => $data['tracking_number'] ?? null,
                'estimated_departure_date' => $data['estimated_departure_date'] ?? null,
                'created_admin_id' => $admin->id,
                'created' => now(),
                'deleted_flag' => false,
            ]);

            $this->attachOrders($batch, $orderIds);

            return $this->repository->findDetail($batch->id);
        });
    }

    public function update(int $id, array $data, Admin $admin): ShipmentBatch
    {
        $batch = $this->repository->findDetail($id);

        if (! $batch) {
            throw new ShipmentBatchException('M0002', 404);
        }

        if ($this->isLockedForOrderChanges($batch->status)) {
            if (isset($data['order_ids'])) {
                throw new ShipmentBatchException('M0504', 409);
            }
        }

        return DB::transaction(function () use ($batch, $data, $admin) {
            $payload = [
                'batch_name' => $data['batch_name'] ?? $batch->batch_name,
                'logistics_partner' => $data['logistics_partner'] ?? $batch->logistics_partner,
                'tracking_number' => $data['tracking_number'] ?? $batch->tracking_number,
                'estimated_departure_date' => $data['estimated_departure_date'] ?? $batch->estimated_departure_date,
                'modified' => now(),
            ];

            if (isset($data['order_ids']) && ! $this->isLockedForOrderChanges($batch->status)) {
                $orderIds = array_values(array_unique(array_map('intval', $data['order_ids'])));

                if (count($orderIds) < 1) {
                    throw new ShipmentBatchException('M0503', 422);
                }

                $this->revertOrdersToConfirmed($batch);
                BatchOrderItem::query()->where('shipment_batch_id', $batch->id)->delete();
                $this->validateOrdersForBatch($orderIds, $batch->id);
                $this->attachOrders($batch, $orderIds);
            }

            return $this->repository->update($batch, $payload);
        });
    }

    public function advanceStatus(int $id, string $newStatus, Admin $admin): ShipmentBatch
    {
        $batch = $this->repository->findDetail($id);

        if (! $batch) {
            throw new ShipmentBatchException('M0002', 404);
        }

        $flow = ShipmentBatchRepository::STATUS_FLOW;
        $currentIndex = array_search($batch->status, $flow, true);

        if ($currentIndex === false) {
            throw new ShipmentBatchException('M0505', 409);
        }

        $nextIndex = array_search($newStatus, $flow, true);

        if ($nextIndex === false || $nextIndex !== $currentIndex + 1) {
            throw new ShipmentBatchException('M0505', 409);
        }

        return DB::transaction(function () use ($batch, $newStatus, $admin) {
            $updated = $this->repository->update($batch, [
                'status' => $newStatus,
                'modified' => now(),
            ]);

            if ($newStatus === 'DELIVERED') {
                // Hàng về kho Việt Nam từ Nhật → auto NHẬP KHO (stockIn)
                // Xuất kho sẽ xảy ra khi đại lý xác nhận nhận hàng (confirmReceipt → COMPLETED)
                // spec: docs/sa/amendments/ai-conversation-upgrade.md, 0-001_Dashboard.xlsx
                $warehouse = $this->warehouseRepository->defaultWarehouse();
                $orderIds = $updated->items->pluck('order_id');
                $orders = Order::query()
                    ->with('details')
                    ->whereIn('id', $orderIds)
                    ->get();

                foreach ($orders as $order) {
                    if ($warehouse) {
                        foreach ($order->details as $detail) {
                            try {
                                // ✅ stockIN — nhập kho tự động khi hàng về từ Nhật
                                $this->inventoryService->stockIn(
                                    (int) $detail->product_id,
                                    (int) $warehouse->id,
                                    (int) $detail->quantity,
                                    $admin->id,
                                    "Nhập kho theo chuyến hàng #{$updated->id} — đơn {$order->order_no}",
                                    'shipment_batch',
                                    $updated->id,
                                );
                            } catch (WarehouseException) {
                                // Hiếm xảy ra với stockIn — log nhưng không block flow
                            }
                        }
                    }

                    $order->update([
                        'status'              => 'DELIVERED_ADMIN',
                        'delivered_admin_at'  => now(),
                        'modified'            => now(),
                        'modified_user_id'    => $admin->id,
                    ]);
                }
            }

            return $updated;
        });
    }

    /**
     * @param  list<int>  $orderIds
     */
    private function validateOrdersForBatch(array $orderIds, ?int $excludeBatchId = null): void
    {
        foreach ($orderIds as $orderId) {
            $order = Order::query()->active()->find($orderId);

            if (! $order) {
                throw new ShipmentBatchException('M0002', 404);
            }

            if ($order->status !== 'CONFIRMED') {
                throw new ShipmentBatchException('M0501', 422);
            }

            if ($this->repository->orderInActiveBatch($orderId)) {
                $existing = BatchOrderItem::query()
                    ->where('order_id', $orderId)
                    ->whereHas('batch', fn ($q) => $q->active()->where('status', '!=', 'DELIVERED'))
                    ->first();

                if ($existing && (int) $existing->shipment_batch_id !== (int) $excludeBatchId) {
                    throw new ShipmentBatchException('M0502', 422);
                }
            }
        }
    }

    /**
     * @param  list<int>  $orderIds
     */
    private function attachOrders(ShipmentBatch $batch, array $orderIds): void
    {
        foreach ($orderIds as $orderId) {
            BatchOrderItem::query()->create([
                'shipment_batch_id' => $batch->id,
                'order_id' => $orderId,
                'created' => now(),
            ]);

            Order::query()->where('id', $orderId)->update([
                'status' => 'PROCESSING',
                'modified' => now(),
            ]);
        }
    }

    private function revertOrdersToConfirmed(ShipmentBatch $batch): void
    {
        $orderIds = $batch->items->pluck('order_id');

        if ($orderIds->isEmpty()) {
            return;
        }

        Order::query()
            ->whereIn('id', $orderIds)
            ->where('status', 'PROCESSING')
            ->update([
                'status' => 'CONFIRMED',
                'modified' => now(),
            ]);
    }

    private function isLockedForOrderChanges(string $status): bool
    {
        $locked = ['IN_TRANSIT', 'CUSTOMS_VN', 'DELIVERED'];

        return in_array($status, $locked, true);
    }

    private function assertCanAccess(ShipmentBatch $batch, Authenticatable $user, string $userType): void
    {
        if ($userType !== 'company') {
            return;
        }

        $hasOrder = $batch->items->contains(
            fn (BatchOrderItem $item) => (int) $item->order?->company_vn_id === (int) $user->id,
        );

        if (! $hasOrder) {
            throw new ShipmentBatchException('M0507', 403);
        }
    }
}
