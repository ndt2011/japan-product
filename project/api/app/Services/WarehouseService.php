<?php

namespace App\Services;

use App\Exceptions\WarehouseException;
use App\Models\Warehouse;
use App\Repositories\WarehouseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WarehouseService
{
    public function __construct(
        private readonly WarehouseRepository $warehouseRepository,
    ) {}

    public function list(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 20), 100);
        $paginator = $this->warehouseRepository->paginate($filters, $perPage);

        $paginator->getCollection()->transform(function (Warehouse $warehouse) {
            $stats = $this->warehouseRepository->statsForWarehouse((int) $warehouse->id);
            $warehouse->setAttribute('total_products', $stats['total_products']);
            $warehouse->setAttribute('total_quantity', $stats['total_quantity']);

            return $warehouse;
        });

        return $paginator;
    }

    public function show(int $id): Warehouse
    {
        $warehouse = $this->warehouseRepository->find($id);

        if (! $warehouse) {
            throw new WarehouseException('M1004', 404);
        }

        $stats = $this->warehouseRepository->statsForWarehouse($id);
        $warehouse->setAttribute('total_products', $stats['total_products']);
        $warehouse->setAttribute('total_quantity', $stats['total_quantity']);

        return $warehouse;
    }

    public function store(array $data, int $userId): Warehouse
    {
        return $this->warehouseRepository->create([
            'warehouse_cd' => $data['warehouse_cd'] ?? null,
            'warehouse_name' => $data['warehouse_name'],
            'address' => $data['address'] ?? null,
            'country' => $data['country'] ?? 'VN',
            'manager_name' => $data['manager_name'] ?? null,
            'tel' => $data['tel'] ?? null,
            'disabled_flag' => false,
            'created' => now(),
            'created_user_id' => $userId,
            'deleted_flag' => false,
        ]);
    }

    public function update(int $id, array $data, int $userId): Warehouse
    {
        $warehouse = $this->show($id);

        return $this->warehouseRepository->update($warehouse, array_merge($data, [
            'modified' => now(),
            'modified_user_id' => $userId,
        ]));
    }
}
