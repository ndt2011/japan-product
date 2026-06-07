<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ProductRepository
{
    public function paginate(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->orderByDesc('products.id')
            ->paginate($perPage);
    }

    public function findDetail(int $id): ?Product
    {
        return Product::query()
            ->active()
            ->with(['category', 'supplier', 'inventories'])
            ->find($id);
    }

    public function findByProductCd(string $productCd, ?int $exceptId = null): ?Product
    {
        $query = Product::query()
            ->active()
            ->where('product_cd', $productCd);

        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->first();
    }

    public function create(array $data): Product
    {
        return Product::query()->create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->fresh(['category', 'supplier', 'inventories']);
    }

    public function softDelete(Product $product): void
    {
        $product->update([
            'deleted_flag' => true,
            'deleted' => now(),
            'modified' => now(),
        ]);
    }

    private function baseQuery(array $filters): Builder
    {
        $query = Product::query()
            ->active()
            ->select('products.*')
            ->with(['category', 'supplier']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_cd', 'like', "%{$search}%")
                    ->orWhere('product_name_jp', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['category_id'])) {
            $query->where('product_category_id', $filters['category_id']);
        }

        return $query;
    }
}
