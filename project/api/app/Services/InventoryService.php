<?php

namespace App\Services;

use App\Exceptions\OrderException;
use App\Exceptions\WarehouseException;
use App\Models\StockMovement;
use App\Repositories\InventoryRepository;
use App\Repositories\StockMovementRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function __construct(
        private readonly InventoryRepository $inventoryRepository,
        private readonly StockMovementRepository $stockMovementRepository,
    ) {}

    public function listInventories(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $this->inventoryRepository->paginate($filters, $perPage);
    }

    public function listMovements(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 50), 100);

        return $this->stockMovementRepository->paginate($filters, $perPage);
    }

    public function movementSummary(array $filters): array
    {
        return $this->stockMovementRepository->summary($filters);
    }

    public function stockIn(
        int $productId,
        int $warehouseId,
        int $quantity,
        int $userId,
        string $reason = '',
        ?string $refType = null,
        ?int $refId = null,
        ?string $note = null,
    ): StockMovement {
        if ($quantity <= 0) {
            throw new WarehouseException('M0001', 422);
        }

        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $userId, $reason, $refType, $refId, $note) {
            $inv = $this->inventoryRepository->firstOrCreate($productId, $warehouseId, $userId);
            $before = (int) $inv->quantity;
            $after = $before + $quantity;

            $inv->update([
                'quantity' => $after,
                'modified' => now(),
                'modified_user_id' => $userId,
            ]);

            return $this->stockMovementRepository->create([
                'movement_type' => 'IN',
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'quantity_before' => $before,
                'quantity_after' => $after,
                'ref_type' => $refType,
                'ref_id' => $refId,
                'reason' => $reason,
                'note' => $note,
                'created' => now(),
                'created_user_id' => $userId,
            ]);
        });
    }

    public function stockOut(
        int $productId,
        int $warehouseId,
        int $quantity,
        int $userId,
        string $reason = '',
        ?string $refType = null,
        ?int $refId = null,
        ?string $note = null,
    ): StockMovement {
        if ($quantity <= 0) {
            throw new WarehouseException('M0001', 422);
        }

        return DB::transaction(function () use ($productId, $warehouseId, $quantity, $userId, $reason, $refType, $refId, $note) {
            $inv = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);

            if (! $inv) {
                throw new WarehouseException('M1005', 404);
            }

            if ($inv->availableQty() < $quantity) {
                throw new WarehouseException('M1002', 409);
            }

            $before = (int) $inv->quantity;
            $after = $before - $quantity;

            $inv->update([
                'quantity' => $after,
                'reserved_qty' => max(0, (int) $inv->reserved_qty - $quantity),
                'modified' => now(),
                'modified_user_id' => $userId,
            ]);

            return $this->stockMovementRepository->create([
                'movement_type' => 'OUT',
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'quantity_before' => $before,
                'quantity_after' => $after,
                'ref_type' => $refType,
                'ref_id' => $refId,
                'reason' => $reason,
                'note' => $note,
                'created' => now(),
                'created_user_id' => $userId,
            ]);
        });
    }

    public function adjust(
        int $productId,
        int $warehouseId,
        int $actualQty,
        int $userId,
        string $reason = 'Kiểm kê định kỳ',
        ?string $note = null,
    ): StockMovement {
        return DB::transaction(function () use ($productId, $warehouseId, $actualQty, $userId, $reason, $note) {
            $inv = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);

            if (! $inv) {
                throw new WarehouseException('M1005', 404);
            }

            $before = (int) $inv->quantity;
            $delta = abs($actualQty - $before);

            $inv->update([
                'quantity' => $actualQty,
                'actual_qty' => $actualQty,
                'last_check_date' => now()->toDateString(),
                'modified' => now(),
                'modified_user_id' => $userId,
            ]);

            return $this->stockMovementRepository->create([
                'movement_type' => 'ADJUST',
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'quantity' => $delta,
                'quantity_before' => $before,
                'quantity_after' => $actualQty,
                'ref_type' => 'check',
                'reason' => $reason,
                'note' => $note ?? "Thực tế: {$actualQty}, hệ thống: {$before}, chênh lệch: ".($actualQty - $before),
                'created' => now(),
                'created_user_id' => $userId,
            ]);
        });
    }

    /**
     * @param  list<array{product_id: int, actual_qty: int, note?: string|null}>  $items
     */
    public function inventoryCheck(int $warehouseId, array $items, int $userId, string $reason): array
    {
        $movements = [];

        foreach ($items as $item) {
            $movement = $this->adjust(
                (int) $item['product_id'],
                $warehouseId,
                (int) $item['actual_qty'],
                $userId,
                $reason,
                $item['note'] ?? null,
            );

            $movements[] = [
                'product_id' => $movement->product_id,
                'before' => $movement->quantity_before,
                'after' => $movement->quantity_after,
                'delta' => $movement->quantity_after - $movement->quantity_before,
            ];
        }

        return [
            'checked_count' => count($items),
            'adjusted_count' => count($movements),
            'movements' => $movements,
        ];
    }

    public function assertCanReserve(int $productId, int $warehouseId, int $qty): void
    {
        $inventory = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);

        if (! $inventory || $inventory->availableQty() < $qty) {
            throw new OrderException('M0401', 409);
        }
    }

    public function reserve(int $productId, int $warehouseId, int $qty): void
    {
        $inventory = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);

        if (! $inventory || $inventory->availableQty() < $qty) {
            throw new OrderException('M0401', 409);
        }

        $this->inventoryRepository->reserve($inventory, $qty);
    }

    public function release(int $productId, int $warehouseId, int $qty): void
    {
        $inventory = $this->inventoryRepository->findForWarehouse($productId, $warehouseId);

        if ($inventory) {
            $this->inventoryRepository->release($inventory, $qty);
        }
    }
}
