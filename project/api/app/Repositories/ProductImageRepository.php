<?php

namespace App\Repositories;

use App\Models\ProductImage;
use Illuminate\Support\Collection;

class ProductImageRepository
{
    public function listByProduct(int $productId): Collection
    {
        return ProductImage::query()
            ->active()
            ->where('product_id', $productId)
            ->orderBy('order_no')
            ->orderBy('id')
            ->get();
    }

    public function findForProduct(int $productId, int $imageId): ?ProductImage
    {
        return ProductImage::query()
            ->active()
            ->where('product_id', $productId)
            ->where('id', $imageId)
            ->first();
    }

    public function create(array $data): ProductImage
    {
        return ProductImage::query()->create($data);
    }

    public function update(ProductImage $image, array $data): ProductImage
    {
        $image->update($data);

        return $image->fresh();
    }

    public function softDelete(ProductImage $image): void
    {
        $image->update(['deleted_flag' => true]);
    }

    public function clearPrimary(int $productId, ?int $exceptId = null): void
    {
        $query = ProductImage::query()
            ->active()
            ->where('product_id', $productId)
            ->where('is_primary', true);

        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }

        $query->update(['is_primary' => false]);
    }

    public function nextOrderNo(int $productId): int
    {
        $max = ProductImage::query()
            ->active()
            ->where('product_id', $productId)
            ->max('order_no');

        return ($max ?? -1) + 1;
    }
}
