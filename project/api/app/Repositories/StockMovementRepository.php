<?php

namespace App\Repositories;

use App\Models\StockMovement;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockMovementRepository
{
    public function create(array $data): StockMovement
    {
        return StockMovement::query()->create($data);
    }

    public function paginate(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = StockMovement::query()
            ->with(['product', 'warehouse'])
            ->orderByDesc('created');

        if (! empty($filters['product_id'])) {
            $query->where('product_id', (int) $filters['product_id']);
        }

        if (! empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', (int) $filters['warehouse_id']);
        }

        if (! empty($filters['movement_type'])) {
            $query->where('movement_type', $filters['movement_type']);
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('created', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('created', '<=', $filters['to_date']);
        }

        return $query->paginate($perPage);
    }

    public function summary(array $filters): array
    {
        $query = StockMovement::query();

        if (! empty($filters['warehouse_id'])) {
            $query->where('warehouse_id', (int) $filters['warehouse_id']);
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('created', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('created', '<=', $filters['to_date']);
        }

        $rows = $query->get(['movement_type', 'quantity']);

        $totalIn = $rows->where('movement_type', 'IN')->sum('quantity');
        $totalOut = $rows->where('movement_type', 'OUT')->sum('quantity');
        $totalAdjust = $rows->where('movement_type', 'ADJUST')->sum('quantity');

        return [
            'total_in' => (int) $totalIn,
            'total_out' => (int) $totalOut,
            'total_adjust' => (int) $totalAdjust,
            'net_change' => (int) $totalIn - (int) $totalOut,
        ];
    }
}
