<?php

namespace App\Services;

use App\Exceptions\ProductException;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Repositories\ProductRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $productRepository,
        private readonly CodeGeneratorService $codeGenerator,
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
        // Auto-generate product_cd nếu không được truyền vào
        // Format: JP-{CAT3}-{SEQ5} — spec: docs/sa/amendments/product-tier-model.md § 2
        if (empty($data['product_cd'])) {
            $categoryName = null;
            if (! empty($data['product_category_id'])) {
                $categoryName = ProductCategory::query()
                    ->find((int) $data['product_category_id'])
                    ?->category_name;
            }
            $data['product_cd'] = $this->codeGenerator->productCode($categoryName);
        }

        $this->assertUniqueProductCd($data['product_cd']);

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
