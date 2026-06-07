<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Nhập kho: tăng số lượng.
     *
     * @param int    $warehouseId
     * @param int    $productId
     * @param int    $quantity      Số lượng nhập (> 0)
     * @param string $referenceType 'order' | 'manual' | 'import'
     * @param int|null $referenceId
     * @param string|null $note
     * @param int    $adminId       ID người thực hiện
     *
     * @throws \Exception
     */
    public function stockIn(
        int $warehouseId,
        int $productId,
        int $quantity,
        string $referenceType = 'manual',
        ?int $referenceId = null,
        ?string $note = null,
        int $adminId = 0
    ): StockMovement {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be > 0 for stock-in');
        }

        return DB::transaction(function () use (
            $warehouseId, $productId, $quantity,
            $referenceType, $referenceId, $note, $adminId
        ) {
            $inventory = Inventory::lockForUpdate()
                ->firstOrCreate(
                    ['warehouse_id' => $warehouseId, 'product_id' => $productId],
                    ['quantity' => 0, 'deleted_flag' => 0]
                );

            $before = $inventory->quantity;
            $after  = $before + $quantity;

            $inventory->quantity = $after;
            $inventory->save();

            return StockMovement::create([
                'warehouse_id'   => $warehouseId,
                'product_id'     => $productId,
                'movement_type'  => StockMovement::TYPE_IN,
                'quantity'       => $quantity,
                'quantity_before'=> $before,
                'quantity_after' => $after,
                'reference_type' => $referenceType,
                'reference_id'   => $referenceId,
                'note'           => $note,
                'created'        => now(),
                'created_user_id'=> $adminId,
            ]);
        });
    }

    /**
     * Xuất kho: giảm số lượng.
     *
     * @throws \Exception khi không đủ tồn kho
     */
    public function stockOut(
        int $warehouseId,
        int $productId,
        int $quantity,
        string $referenceType = 'order',
        ?int $referenceId = null,
        ?string $note = null,
        int $adminId = 0
    ): StockMovement {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be > 0 for stock-out');
        }

        return DB::transaction(function () use (
            $warehouseId, $productId, $quantity,
            $referenceType, $referenceId, $note, $adminId
        ) {
            $inventory = Inventory::lockForUpdate()
                ->where('warehouse_id', $warehouseId)
                ->where('product_id', $productId)
                ->where('deleted_flag', 0)
                ->first();

            if (!$inventory || $inventory->quantity < $quantity) {
                throw new \Exception(
                    "M5001: Không đủ tồn kho. Hiện có: " . ($inventory->quantity ?? 0)
                );
            }

            $before = $inventory->quantity;
            $after  = $before - $quantity;

            $inventory->quantity = $after;
            $inventory->save();

            return StockMovement::create([
                'warehouse_id'   => $warehouseId,
                'product_id'     => $productId,
                'movement_type'  => StockMovement::TYPE_OUT,
                'quantity'       => $quantity,
                'quantity_before'=> $before,
                'quantity_after' => $after,
                'reference_type' => $referenceType,
                'reference_id'   => $referenceId,
                'note'           => $note,
                'created'        => now(),
                'created_user_id'=> $adminId,
            ]);
        });
    }

    /**
     * Điều chỉnh tồn kho (inventory check / kiểm kê).
     * quantity là số thực tế đếm được — có thể tăng hoặc giảm.
     */
    public function adjust(
        int $warehouseId,
        int $productId,
        int $actualQuantity,
        ?string $note = null,
        int $adminId = 0
    ): StockMovement {
        if ($actualQuantity < 0) {
            throw new \InvalidArgumentException('Actual quantity cannot be negative');
        }

        return DB::transaction(function () use (
            $warehouseId, $productId, $actualQuantity, $note, $adminId
        ) {
            $inventory = Inventory::lockForUpdate()
                ->firstOrCreate(
                    ['warehouse_id' => $warehouseId, 'product_id' => $productId],
                    ['quantity' => 0, 'deleted_flag' => 0]
                );

            $before = $inventory->quantity;
            $diff   = $actualQuantity - $before;   // + hoặc -

            $inventory->quantity = $actualQuantity;
            $inventory->save();

            return StockMovement::create([
                'warehouse_id'   => $warehouseId,
                'product_id'     => $productId,
                'movement_type'  => StockMovement::TYPE_ADJUST,
                'quantity'       => abs($diff),
                'quantity_before'=> $before,
                'quantity_after' => $actualQuantity,
                'reference_type' => 'inventory_check',
                'reference_id'   => null,
                'note'           => $note ?? "Kiểm kê: thực tế {$actualQuantity}, hệ thống {$before}",
                'created'        => now(),
                'created_user_id'=> $adminId,
            ]);
        });
    }
}
