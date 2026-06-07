<?php

namespace App\Services;

use App\Exceptions\ProductException;
use App\Models\Product;
use App\Repositories\ProductRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $productRepository,
    ) {}

    public function list(array $filters): LengthAwarePaginator
    {
        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $this->productRepository->paginate($filters, $perPage);
    }

    public function show(int $id): Product
    {
        $product = $this->productRepository->findDetail($id);

        if (! $product) {
            throw new ProductException('M0002', 404);
        }

        return $product;
    }

    public function store(array $data): Product
    {
        $this->assertUniqueProductCd($data['product_cd'] ?? null);

        $data['created'] = now();
        $data['deleted_flag'] = false;

        return $this->productRepository->create($data);
    }

    public function update(int $id, array $data): Product
    {
        $product = $this->show($id);
        $this->assertUniqueProductCd($data['product_cd'] ?? null, $product->id);

        $data['modified'] = now();

        return $this->productRepository->update($product, $data);
    }

    public function destroy(int $id): void
    {
        $product = $this->show($id);

        if ($product->orderDetails()->exists()) {
            throw new ProductException('M0304', 409);
        }

        $this->productRepository->softDelete($product);
    }

    private function assertUniqueProductCd(?string $productCd, ?int $exceptId = null): void
    {
        if (! $productCd) {
            return;
        }

        if ($this->productRepository->findByProductCd($productCd, $exceptId)) {
            throw new ProductException('M0302', 409);
        }
    }
}
