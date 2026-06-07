<?php

namespace App\Services;

use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    private string $disk;

    public function __construct()
    {
        // Prod: 'r2' (Cloudflare R2 via S3 driver)
        // Local: 'public'
        $this->disk = config('filesystems.default_images', 'public');
    }

    /**
     * Upload nhiều ảnh cho 1 sản phẩm.
     *
     * @param  UploadedFile[] $files
     * @param  int            $productId
     * @param  int            $primaryIndex  Index trong mảng $files là ảnh chính
     * @return ProductImage[]
     */
    public function uploadMany(array $files, int $productId, int $primaryIndex = 0): array
    {
        // Lấy order_no hiện tại lớn nhất
        $maxOrder = ProductImage::where('product_id', $productId)
            ->where('deleted_flag', 0)
            ->max('order_no') ?? -1;

        // Nếu đây là lần upload đầu tiên → ảnh $primaryIndex sẽ là primary
        $hasPrimary = ProductImage::where('product_id', $productId)
            ->where('is_primary', 1)
            ->where('deleted_flag', 0)
            ->exists();

        $created = [];

        foreach ($files as $index => $file) {
            $path      = $this->storeFile($file, $productId);
            $isPrimary = !$hasPrimary && $index === $primaryIndex ? 1 : 0;

            $image = ProductImage::create([
                'product_id'  => $productId,
                'image_path'  => $path,
                'is_primary'  => $isPrimary,
                'order_no'    => ++$maxOrder,
                'created'     => now(),
                'deleted_flag'=> 0,
            ]);

            $created[] = $image;

            if ($isPrimary) {
                $hasPrimary = true;
                $this->syncPrimaryToProduct($productId, $path);
            }
        }

        return $created;
    }

    /**
     * Đặt ảnh chính (is_primary = 1).
     * Unset tất cả ảnh khác, set ảnh này làm primary.
     */
    public function setPrimary(int $imageId, int $productId): ProductImage
    {
        // Unset tất cả
        ProductImage::where('product_id', $productId)->update(['is_primary' => 0]);

        // Set ảnh được chọn
        $image = ProductImage::where('id', $imageId)
            ->where('product_id', $productId)
            ->where('deleted_flag', 0)
            ->firstOrFail();

        $image->update(['is_primary' => 1]);
        $this->syncPrimaryToProduct($productId, $image->image_path);

        return $image;
    }

    /**
     * Xóa 1 ảnh (soft delete).
     * Nếu là ảnh primary → tự động chọn ảnh tiếp theo làm primary.
     */
    public function delete(int $imageId, int $productId): void
    {
        $image = ProductImage::where('id', $imageId)
            ->where('product_id', $productId)
            ->where('deleted_flag', 0)
            ->firstOrFail();

        $wasPrimary = $image->is_primary;

        $image->update([
            'deleted_flag' => 1,
            'deleted'      => now(),
        ]);

        // Nếu xóa ảnh primary → chọn ảnh tiếp theo
        if ($wasPrimary) {
            $next = ProductImage::where('product_id', $productId)
                ->where('deleted_flag', 0)
                ->orderBy('order_no')
                ->first();

            if ($next) {
                $next->update(['is_primary' => 1]);
                $this->syncPrimaryToProduct($productId, $next->image_path);
            } else {
                // Không còn ảnh nào
                \App\Models\Product::where('id', $productId)->update(['image_path' => null]);
            }
        }
    }

    /**
     * Sắp xếp lại thứ tự ảnh.
     *
     * @param array $orderedIds  Mảng image ID theo thứ tự mới
     */
    public function reorder(array $orderedIds, int $productId): void
    {
        foreach ($orderedIds as $orderNo => $imageId) {
            ProductImage::where('id', $imageId)
                ->where('product_id', $productId)
                ->where('deleted_flag', 0)
                ->update(['order_no' => $orderNo]);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private function storeFile(UploadedFile $file, int $productId): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path     = "products/{$productId}/{$filename}";

        Storage::disk($this->disk)->putFileAs(
            "products/{$productId}",
            $file,
            $filename
        );

        return $path;
    }

    /**
     * Sync ảnh primary vào products.image_path
     */
    private function syncPrimaryToProduct(int $productId, string $imagePath): void
    {
        \App\Models\Product::where('id', $productId)
            ->update(['image_path' => $imagePath]);
    }

    /**
     * Lấy public URL cho ảnh
     */
    public function getUrl(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }
}
