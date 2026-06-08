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
            ->with(['category', 'supplier', 'inventories', 'images'])
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
        // Subquery: primary image path (column: image_path, order: order_no)
        $primaryImageSub = \DB::table('product_images')
            ->select('image_path')
            ->whereColumn('product_images.product_id', 'products.id')
            ->where('product_images.is_primary', true)
            ->where('product_images.deleted_flag', false)
            ->orderBy('product_images.order_no')
            ->limit(1);

        // Subquery: available_qty = quantity - reserved_qty (tổng tất cả kho)
        $availableQtySub = \DB::table('inventories')
            ->selectRaw('COALESCE(SUM(quantity - reserved_qty), 0)')
            ->whereColumn('inventories.product_id', 'products.id')
            ->where('inventories.deleted_flag', false);

        $query = Product::query()
            ->active()
            ->select([
                'products.*',
                \DB::raw("({$primaryImageSub->toSql()}) as primary_image_url"),
                \DB::raw("({$availableQtySub->toSql()}) as available_qty"),
            ])
            ->addBinding($primaryImageSub->getBindings(), 'select')
            ->addBinding($availableQtySub->getBindings(), 'select')
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

        // Filter theo tình trạng kho (dùng raw SQL độc lập để tránh binding conflict)
        $invSql = '(SELECT COALESCE(SUM(i.quantity - i.reserved_qty), 0) FROM inventories i WHERE i.product_id = products.id AND i.deleted_flag = 0)';

        if (! empty($filters['stock_status'])) {
            match ($filters['stock_status']) {
                'IN_STOCK'     => $query->havingRaw("{$invSql} >= 10"),
                'LOW_STOCK'    => $query->havingRaw("{$invSql} BETWEEN 1 AND 9"),
                'OUT_OF_STOCK' => $query->havingRaw("{$invSql} = 0"),
                default        => null,
            };
        }

        return $query;
    }
}
