<?php

namespace App\Services;

use App\Exceptions\ProductException;
use App\Models\ProductImage;
use App\Repositories\ProductImageRepository;
use App\Repositories\ProductRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

class ProductImageService
{
    public function __construct(
        private readonly ProductRepository $productRepository,
        private readonly ProductImageRepository $productImageRepository,
        private readonly ImageStorageService $imageStorageService,
    ) {}

    public function list(int $productId): Collection
    {
        $this->assertProductExists($productId);

        return $this->productImageRepository->listByProduct($productId);
    }

    public function store(int $productId, UploadedFile $file, bool $isPrimary = false): ProductImage
    {
        $product = $this->assertProductExists($productId);

        $imagePath = $this->imageStorageService->upload($file, $productId);
        $hasImages = $this->productImageRepository->listByProduct($productId)->isNotEmpty();
        $makePrimary = $isPrimary || ! $hasImages;

        if ($makePrimary) {
            $this->productImageRepository->clearPrimary($productId);
        }

        $image = $this->productImageRepository->create([
            'product_id' => $productId,
            'image_path' => $imagePath,
            'is_primary' => $makePrimary,
            'order_no' => $this->productImageRepository->nextOrderNo($productId),
            'created' => now(),
            'deleted_flag' => false,
        ]);

        if ($makePrimary) {
            $this->syncProductPrimaryImage($product->id, $imagePath);
        }

        return $image;
    }

    public function update(int $productId, int $imageId, array $data): ProductImage
    {
        $this->assertProductExists($productId);

        $image = $this->productImageRepository->findForProduct($productId, $imageId);

        if (! $image) {
            throw new ProductException('M0002', 404);
        }

        if (! empty($data['is_primary'])) {
            $this->productImageRepository->clearPrimary($productId, $image->id);
            $data['is_primary'] = true;
            $this->syncProductPrimaryImage($productId, $image->image_path);
        }

        return $this->productImageRepository->update($image, $data);
    }

    public function destroy(int $productId, int $imageId): void
    {
        $this->assertProductExists($productId);

        $image = $this->productImageRepository->findForProduct($productId, $imageId);

        if (! $image) {
            throw new ProductException('M0002', 404);
        }

        $wasPrimary = $image->is_primary;
        $this->imageStorageService->deleteByUrl($image->image_path);
        $this->productImageRepository->softDelete($image);

        if ($wasPrimary) {
            $next = $this->productImageRepository->listByProduct($productId)->first();
            if ($next) {
                $this->productImageRepository->clearPrimary($productId);
                $this->productImageRepository->update($next, ['is_primary' => true]);
                $this->syncProductPrimaryImage($productId, $next->image_path);
            } else {
                $this->syncProductPrimaryImage($productId, null);
            }
        }
    }

    private function assertProductExists(int $productId)
    {
        $product = $this->productRepository->findDetail($productId);

        if (! $product) {
            throw new ProductException('M0002', 404);
        }

        return $product;
    }

    private function syncProductPrimaryImage(int $productId, ?string $imagePath): void
    {
        $product = $this->productRepository->findDetail($productId);

        if ($product) {
            $this->productRepository->update($product, [
                'image_path' => $imagePath,
                'modified' => now(),
            ]);
        }
    }
}
