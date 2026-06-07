# Amendment — Upload ảnh sản phẩm (BE + FE)

> **Ngày**: 2026-06-07 | **Phụ thuộc**: `product_images-table.md`  
> **Mục tiêu**: Lưu ảnh khi tạo/sửa sản phẩm, hỗ trợ nhiều ảnh, đặt ảnh chính

---

## Tổng quan luồng

```
[FE] Form tạo/sửa SP
  → Chọn file ảnh (drag & drop hoặc click)
  → Preview ngay trên trình duyệt
  → Submit form → POST /products (multipart/form-data)
        ↓
  [BE] Validate file → lưu Storage → lưu product_images
        ↓
  Response trả URL ảnh → FE hiển thị
```

**2 trường hợp upload**:
1. **Khi tạo SP** → `POST /products` kèm `images[]` (multipart)
2. **Sau khi đã có SP** → `POST /products/{id}/images` (thêm ảnh riêng lẻ)

---

## Storage — Cấu hình

### Local (dev)

```env
# project/api/.env
FILESYSTEM_DISK=public
APP_URL=http://localhost:8000
```

```bash
# Tạo symlink để truy cập public/storage
php artisan storage:link
```

Ảnh lưu tại: `storage/app/public/products/`  
URL truy cập: `http://localhost:8000/storage/products/abc.jpg`

### Production (Railway — dùng S3/Cloudflare R2)

Railway không có persistent disk → dùng **Cloudflare R2** (miễn phí 10GB):

```env
# Railway Variables
FILESYSTEM_DISK=r2
AWS_ACCESS_KEY_ID=xxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxx
AWS_DEFAULT_REGION=auto
AWS_BUCKET=tt-product-images
AWS_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
AWS_URL=https://pub-xxxxx.r2.dev   # URL public của R2 bucket
```

```bash
composer require league/flysystem-aws-s3-v3
```

**`config/filesystems.php`** — thêm disk r2:

```php
'r2' => [
    'driver'   => 's3',
    'key'      => env('AWS_ACCESS_KEY_ID'),
    'secret'   => env('AWS_SECRET_ACCESS_KEY'),
    'region'   => env('AWS_DEFAULT_REGION', 'auto'),
    'bucket'   => env('AWS_BUCKET'),
    'endpoint' => env('AWS_ENDPOINT'),
    'url'      => env('AWS_URL'),
    'use_path_style_endpoint' => true,
    'visibility' => 'public',
],
```

> **Dev không có R2**: Dùng `FILESYSTEM_DISK=public` là ổn. Chỉ đổi sang R2 trên Railway.

---

## Migration — product_images (cập nhật đầy đủ)

**File**: `2026_06_07_180000_create_product_images_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('product_id');
            $table->string('image_path', 500);          // URL đầy đủ hoặc path
            $table->string('file_name', 255)->nullable(); // tên file gốc
            $table->unsignedInteger('file_size')->nullable(); // bytes
            $table->tinyInteger('is_primary')->default(0);
            $table->unsignedInteger('order_no')->default(0);
            $table->tinyInteger('deleted_flag')->default(0);
            $table->datetime('created');
            $table->unsignedInteger('created_user_id');

            $table->foreign('product_id')->references('id')->on('products');
            $table->index(['product_id', 'deleted_flag']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
```

---

## Model — ProductImage

**File**: `app/Models/ProductImage.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    public $timestamps = false;

    protected $table = 'product_images';

    protected $fillable = [
        'product_id', 'image_path', 'file_name', 'file_size',
        'is_primary', 'order_no', 'deleted_flag',
        'created', 'created_user_id',
    ];

    protected $casts = [
        'is_primary'   => 'boolean',
        'deleted_flag' => 'boolean',
    ];

    protected $hidden = ['deleted_flag'];

    // Scope: chưa xóa
    public function scopeActive($query)
    {
        return $query->where('deleted_flag', 0);
    }

    // Relationship
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
```

---

## Service — ProductImageService

**File**: `app/Services/ProductImageService.php`

```php
<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    private const MAX_IMAGES   = 8;     // tối đa 8 ảnh/sản phẩm
    private const MAX_SIZE_MB  = 5;     // 5MB/ảnh
    private const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

    /**
     * Upload nhiều ảnh cho 1 sản phẩm
     * $files: array của UploadedFile
     * $firstIsPrimary: ảnh đầu tiên sẽ là primary nếu SP chưa có primary
     */
    public function uploadMany(Product $product, array $files, int $userId, bool $firstIsPrimary = false): array
    {
        $currentCount = ProductImage::where('product_id', $product->id)
                                    ->where('deleted_flag', 0)
                                    ->count();

        $canUpload = self::MAX_IMAGES - $currentCount;
        if ($canUpload <= 0) {
            throw new \Exception("Sản phẩm đã có tối đa " . self::MAX_IMAGES . " ảnh.");
        }

        $files  = array_slice($files, 0, $canUpload);
        $result = [];

        DB::transaction(function () use ($product, $files, $userId, $firstIsPrimary, &$result) {
            $hasPrimary = ProductImage::where('product_id', $product->id)
                                      ->where('is_primary', 1)
                                      ->where('deleted_flag', 0)
                                      ->exists();

            $maxOrder = ProductImage::where('product_id', $product->id)
                                    ->where('deleted_flag', 0)
                                    ->max('order_no') ?? -1;

            foreach ($files as $index => $file) {
                $path     = $this->store($file, $product->id);
                $url      = $this->url($path);
                $isPrimary = (!$hasPrimary && ($firstIsPrimary || $index === 0)) ? 1 : 0;

                $image = ProductImage::create([
                    'product_id'      => $product->id,
                    'image_path'      => $url,
                    'file_name'       => $file->getClientOriginalName(),
                    'file_size'       => $file->getSize(),
                    'is_primary'      => $isPrimary,
                    'order_no'        => ++$maxOrder,
                    'deleted_flag'    => 0,
                    'created'         => now(),
                    'created_user_id' => $userId,
                ]);

                if ($isPrimary) {
                    $hasPrimary = true;
                    // Sync vào products.image_path
                    $product->update(['image_path' => $url]);
                }

                $result[] = $image;
            }
        });

        return $result;
    }

    /**
     * Đặt ảnh làm primary
     */
    public function setPrimary(ProductImage $image): void
    {
        DB::transaction(function () use ($image) {
            // Bỏ primary cũ
            ProductImage::where('product_id', $image->product_id)
                        ->where('is_primary', 1)
                        ->update(['is_primary' => 0]);

            // Set primary mới
            $image->update(['is_primary' => 1]);

            // Sync products.image_path
            $image->product->update(['image_path' => $image->image_path]);
        });
    }

    /**
     * Xóa ảnh (soft delete)
     */
    public function delete(ProductImage $image): void
    {
        DB::transaction(function () use ($image) {
            $image->update(['deleted_flag' => 1]);

            // Nếu đây là primary → set primary cho ảnh tiếp theo
            if ($image->is_primary) {
                $next = ProductImage::where('product_id', $image->product_id)
                                    ->where('deleted_flag', 0)
                                    ->where('id', '!=', $image->id)
                                    ->orderBy('order_no')
                                    ->first();

                if ($next) {
                    $next->update(['is_primary' => 1]);
                    $image->product->update(['image_path' => $next->image_path]);
                } else {
                    $image->product->update(['image_path' => null]);
                }
            }
        });
    }

    /**
     * Sắp xếp lại thứ tự ảnh
     * $orderedIds: array ID ảnh theo thứ tự mới
     */
    public function reorder(int $productId, array $orderedIds): void
    {
        foreach ($orderedIds as $order => $id) {
            ProductImage::where('id', $id)
                        ->where('product_id', $productId)
                        ->where('deleted_flag', 0)
                        ->update(['order_no' => $order]);
        }
    }

    // -------------------------------------------------------
    private function store(UploadedFile $file, int $productId): string
    {
        $ext      = $file->getClientOriginalExtension();
        $filename = date('Ymd_His') . '_' . Str::random(8) . '.' . $ext;
        $path     = "products/{$productId}/{$filename}";

        Storage::disk(config('filesystems.default'))->put($path, file_get_contents($file), 'public');
        return $path;
    }

    private function url(string $path): string
    {
        return Storage::disk(config('filesystems.default'))->url($path);
    }
}
```

---

## Controller — ProductImageController

**File**: `app/Http/Controllers/Api/ProductImageController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function __construct(private ProductImageService $imageService) {}

    /**
     * GET /products/{productId}/images
     * Danh sách ảnh của sản phẩm
     */
    public function index(int $productId): JsonResponse
    {
        $images = ProductImage::where('product_id', $productId)
                              ->where('deleted_flag', 0)
                              ->orderBy('order_no')
                              ->get(['id', 'image_path', 'file_name', 'file_size', 'is_primary', 'order_no']);

        return response()->json(['success' => true, 'data' => $images]);
    }

    /**
     * POST /products/{productId}/images
     * Upload thêm ảnh (sau khi đã tạo SP)
     * Body: multipart/form-data
     *   images[]: file (required, max 8 files)
     */
    public function store(Request $request, int $productId): JsonResponse
    {
        $request->validate([
            'images'   => 'required|array|max:8',
            'images.*' => 'file|mimes:jpg,jpeg,png,webp|max:5120', // 5MB
        ]);

        $product = Product::findOrFail($productId);
        $userId  = auth()->id();

        $uploaded = $this->imageService->uploadMany($product, $request->file('images'), $userId);

        return response()->json([
            'success' => true,
            'data'    => collect($uploaded)->map(fn($img) => [
                'id'         => $img->id,
                'image_path' => $img->image_path,
                'is_primary' => (bool) $img->is_primary,
                'order_no'   => $img->order_no,
            ]),
            'message' => 'M0000',
        ], 201);
    }

    /**
     * PUT /products/{productId}/images/{imageId}/set-primary
     * Đặt ảnh làm primary
     */
    public function setPrimary(int $productId, int $imageId): JsonResponse
    {
        $image = ProductImage::where('id', $imageId)
                             ->where('product_id', $productId)
                             ->where('deleted_flag', 0)
                             ->firstOrFail();

        $this->imageService->setPrimary($image);

        return response()->json(['success' => true, 'message' => 'M0000']);
    }

    /**
     * PUT /products/{productId}/images/reorder
     * Body: { "ids": [3, 1, 2] }  — thứ tự mới
     */
    public function reorder(Request $request, int $productId): JsonResponse
    {
        $request->validate(['ids' => 'required|array']);

        $this->imageService->reorder($productId, $request->input('ids'));

        return response()->json(['success' => true, 'message' => 'M0000']);
    }

    /**
     * DELETE /products/{productId}/images/{imageId}
     * Xóa ảnh (soft delete)
     */
    public function destroy(int $productId, int $imageId): JsonResponse
    {
        $image = ProductImage::where('id', $imageId)
                             ->where('product_id', $productId)
                             ->where('deleted_flag', 0)
                             ->firstOrFail();

        $this->imageService->delete($image);

        return response()->json(['success' => true, 'message' => 'M0000']);
    }
}
```

---

## Cập nhật ProductController — tạo SP kèm ảnh

```php
// app/Http/Controllers/Api/ProductController.php

public function store(Request $request): JsonResponse
{
    $request->validate([
        // ... validate fields SP hiện có ...
        'product_name' => 'required|string|max:300',
        'product_cd'   => 'required|string|max:50|unique:products',
        // ...

        // Ảnh (tùy chọn khi tạo)
        'images'       => 'nullable|array|max:8',
        'images.*'     => 'file|mimes:jpg,jpeg,png,webp|max:5120',
    ]);

    $product = DB::transaction(function () use ($request) {
        // 1. Tạo sản phẩm
        $product = Product::create([
            // ... fields SP ...
            'created'         => now(),
            'created_user_id' => auth()->id(),
        ]);

        // 2. Upload ảnh nếu có
        if ($request->hasFile('images')) {
            app(ProductImageService::class)->uploadMany(
                product:        $product,
                files:          $request->file('images'),
                userId:         auth()->id(),
                firstIsPrimary: true, // ảnh đầu tiên là primary
            );

            // Reload để lấy image_path đã sync
            $product->refresh();
        }

        return $product;
    });

    return response()->json([
        'success' => true,
        'data'    => $product->load('images'),
        'message' => 'M0201', // Tạo sản phẩm thành công
    ], 201);
}
```

> **Lưu ý**: Khi POST kèm file, FE phải dùng `Content-Type: multipart/form-data`, KHÔNG dùng `application/json`.

---

## Routes

```php
// routes/api.php — thêm vào group auth:sanctum + role:admin

Route::prefix('products')->group(function () {
    Route::apiResource('/', ProductController::class);

    // Quản lý ảnh
    Route::prefix('{productId}/images')->group(function () {
        Route::get('/',                          [ProductImageController::class, 'index']);
        Route::post('/',                         [ProductImageController::class, 'store']);
        Route::put('{imageId}/set-primary',      [ProductImageController::class, 'setPrimary']);
        Route::put('reorder',                    [ProductImageController::class, 'reorder']);
        Route::delete('{imageId}',               [ProductImageController::class, 'destroy']);
    });
});
```

---

## API Contract — tóm tắt endpoints ảnh

| Method | URL | Mô tả | Auth |
|--------|-----|-------|------|
| GET | `/products/{id}/images` | Danh sách ảnh | All |
| POST | `/products/{id}/images` | Upload ảnh (multipart) | Admin |
| PUT | `/products/{id}/images/{imgId}/set-primary` | Đặt ảnh chính | Admin |
| PUT | `/products/{id}/images/reorder` | Sắp xếp lại | Admin |
| DELETE | `/products/{id}/images/{imgId}` | Xóa ảnh | Admin |
| POST | `/products` | Tạo SP kèm ảnh (multipart) | Admin |

---

## FE — Form tạo/sửa sản phẩm (React)

### Component ImageUploader

```tsx
// components/products/ImageUploader.tsx
'use client';
import { useState, useCallback } from 'react';

interface UploadedImage {
  id?: number;           // có nếu đã lưu server
  url: string;           // URL preview hoặc server
  file?: File;           // có nếu chưa upload
  isPrimary: boolean;
}

interface Props {
  productId?: number;    // undefined khi đang tạo mới
  initialImages?: UploadedImage[];
  onChange?: (files: File[]) => void;  // dùng khi tạo mới
}

export function ImageUploader({ productId, initialImages = [], onChange }: Props) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [dragging, setDragging] = useState(false);

  const MAX_IMAGES = 8;

  // Chọn file từ input
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const newFiles = Array.from(files)
      .filter(f => allowed.includes(f.type) && f.size <= 5 * 1024 * 1024)
      .slice(0, MAX_IMAGES - images.length);

    const previews: UploadedImage[] = newFiles.map((file, i) => ({
      url:       URL.createObjectURL(file),
      file,
      isPrimary: images.length === 0 && i === 0,  // ảnh đầu tiên là primary
    }));

    const next = [...images, ...previews];
    setImages(next);
    onChange?.(next.filter(img => img.file).map(img => img.file!));
  }, [images, onChange]);

  // Drag & Drop
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Xóa ảnh (chỉ local, chưa lên server)
  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    // Nếu xóa primary → set primary cho index 0
    if (images[index].isPrimary && next.length > 0) {
      next[0].isPrimary = true;
    }
    setImages(next);
    onChange?.(next.filter(img => img.file).map(img => img.file!));
  };

  const setPrimary = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {images.length < MAX_IMAGES && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
            ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
          onClick={() => document.getElementById('image-input')?.click()}
        >
          <p className="text-gray-500 text-sm">
            Kéo thả ảnh vào đây hoặc <span className="text-blue-500 underline">chọn file</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">
            JPG, PNG, WEBP — tối đa 5MB/ảnh, tối đa {MAX_IMAGES} ảnh
          </p>
          <input
            id="image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={img.url}
                alt={`Ảnh ${index + 1}`}
                className={`w-full h-full object-cover rounded-lg border-2
                  ${img.isPrimary ? 'border-blue-500' : 'border-transparent'}`}
              />

              {/* Badge ảnh chính */}
              {img.isPrimary && (
                <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  Chính
                </span>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                              rounded-lg transition flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Đặt chính
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-400">{images.length}/{MAX_IMAGES} ảnh</p>
      )}
    </div>
  );
}
```

### Form tạo sản phẩm — gửi multipart

```tsx
// app/(dashboard)/products/new/page.tsx

export default function CreateProductPage() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleSubmit = async (formData: ProductFormData) => {
    // Dùng FormData để gửi file
    const body = new FormData();

    // Thêm các trường text
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        body.append(key, String(value));
      }
    });

    // Thêm ảnh
    imageFiles.forEach((file) => {
      body.append('images[]', file);
    });

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        // KHÔNG set Content-Type — browser tự set multipart boundary
      },
      body,
    });

    const data = await res.json();
    if (data.success) router.push('/products');
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... fields thông tin SP ... */}

      <div>
        <label className="block text-sm font-medium mb-1">Ảnh sản phẩm</label>
        <ImageUploader onChange={setImageFiles} />
      </div>

      <button type="submit">Tạo sản phẩm</button>
    </form>
  );
}
```

### Form sửa sản phẩm — load ảnh sẵn + upload thêm

```tsx
// Khi edit: load ảnh hiện có từ GET /products/{id}/images
// Upload thêm: gọi POST /products/{id}/images
// Xóa: gọi DELETE /products/{id}/images/{imgId}
// Set primary: gọi PUT /products/{id}/images/{imgId}/set-primary

const { data: existingImages } = useSWR(`/api/products/${id}/images`);

// Upload thêm ảnh
const uploadMore = async (files: File[]) => {
  const body = new FormData();
  files.forEach(f => body.append('images[]', f));

  await fetch(`/api/products/${id}/images`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
  mutate(); // refresh danh sách
};

// Xóa ảnh đã lưu server
const deleteImage = async (imageId: number) => {
  await fetch(`/api/products/${id}/images/${imageId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  mutate();
};
```

---

## Checklist cho dev

### Backend
```
[ ] Migration product_images (đã có schema trong amendment)
[ ] Cài thêm: composer require league/flysystem-aws-s3-v3 (chỉ cần cho production R2)
[ ] php artisan storage:link (local dev)
[ ] Tạo ProductImage model
[ ] Tạo ProductImageService
[ ] Tạo ProductImageController
[ ] Cập nhật ProductController::store() nhận images[]
[ ] Thêm routes /products/{id}/images/*
[ ] Test upload local: POST /products/1/images với file jpg
[ ] Config .env: FILESYSTEM_DISK=public (local), r2 (production)
```

### Frontend
```
[ ] Tạo component ImageUploader (drag-drop + preview)
[ ] Tích hợp vào form tạo SP: gửi FormData thay vì JSON
[ ] Tích hợp vào form sửa SP: load ảnh hiện có + upload thêm/xóa
[ ] Test: tạo SP kèm 3 ảnh → kiểm tra preview → submit → thấy ảnh trên trang SP
[ ] Ẩn nút upload với role Company
```

### Production (Railway)
```
[ ] Tạo Cloudflare R2 bucket (miễn phí 10GB)
[ ] Bật public access cho bucket R2
[ ] Thêm biến môi trường Railway: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_ENDPOINT, AWS_URL
[ ] FILESYSTEM_DISK=r2
[ ] Test upload trên Railway
```

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `419 CSRF` khi upload | FE gửi JSON header với FormData | Bỏ `Content-Type` header, để browser tự set |
| Ảnh upload OK nhưng không xem được | Chưa chạy `php artisan storage:link` | Chạy lệnh rồi restart |
| `413 Request Entity Too Large` | Nginx/PHP giới hạn upload size | Tăng `client_max_body_size 20M` (Nginx) + `upload_max_filesize=20M` (php.ini) |
| Railway: ảnh mất sau restart | Railway không có persistent disk | Dùng R2 cho production, không lưu local |
| `Could not connect to R2` | Sai endpoint/credentials | Kiểm tra AWS_ENDPOINT format: `https://<account-id>.r2.cloudflarestorage.com` |
