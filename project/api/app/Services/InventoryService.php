<?php

namespace App\Services;

use App\Exceptions\OrderException;
use App\Repositories\InventoryRepository;

class InventoryService
{
    public function __construct(
        private readonly InventoryRepository $inventoryRepository,
    ) {}

    public function assertCanReserve(int $productId, int $qty): void
    {
        $inventory = $this->inventoryRepository->findByProduct($productId);

        if (! $inventory || $inventory->availableQty() < $qty) {
            throw new OrderException('M0401', 409);
        }
    }

    public function reserve(int $productId, int $qty): void
    {
        $inventory = $this->inventoryRepository->findByProduct($productId);

        if (! $inventory || $inventory->availableQty() < $qty) {
            throw new OrderException('M0401', 409);
        }

        $this->inventoryRepository->reserve($inventory, $qty);
    }

    public function release(int $productId, int $qty): void
    {
        $inventory = $this->inventoryRepository->findByProduct($productId);

        if ($inventory) {
            $this->inventoryRepository->release($inventory, $qty);
        }
    }
}
