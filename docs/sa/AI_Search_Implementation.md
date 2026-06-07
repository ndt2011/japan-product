# AI Product Search — Hướng dẫn tích hợp OpenAI (Luồng B)

> **Stack**: Laravel + OpenAI Embeddings + MySQL (không cần Pinecone cho catalog nhỏ)  
> **Kết quả**: Tìm kiếm ngữ nghĩa trong catalog nội bộ, trả về 10–20 sản phẩm kèm hình ảnh  
> **Trạng thái code**: 📋 **Chưa triển khai** — tài liệu hướng dẫn cho task BE-016b  
> **Đã có sẵn (luồng A)**: `POST/GET /ai/search` + duyệt candidates — xem `04_API_Contract.md` Module 3, `amendments/ai_search-tables.md`

---

## Tổng quan luồng

```
User gõ "thuốc bổ gan nhật bản"
    ↓
Laravel gửi lên OpenAI → nhận vector 1536 chiều
    ↓
So sánh với vector của từng sản phẩm (lưu trong MySQL)
    ↓
Trả về top 10-20 sản phẩm gần nhất + hình ảnh
```

---

## Bước 1 — Cài package & cấu hình

```bash
composer require openai-php/laravel
php artisan vendor:publish --provider="OpenAI\Laravel\ServiceProvider"
```

Thêm vào `.env`:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxx   # key mới của bạn
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_SEARCH_LIMIT=15                # số sản phẩm trả về (10-20)
```

---

## Bước 2 — Migration: thêm cột embedding vào products

**File**: `database/migrations/2026_06_07_200000_add_embedding_to_products_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Lưu vector 1536 chiều dưới dạng JSON
            $table->json('embedding')->nullable()->after('memo');
            $table->timestamp('embedding_updated_at')->nullable()->after('embedding');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['embedding', 'embedding_updated_at']);
        });
    }
};
```

```bash
php artisan migrate
```

---

## Bước 3 — ProductEmbeddingService

**File**: `app/Services/ProductEmbeddingService.php`

```php
<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class ProductEmbeddingService
{
    private int $limit;

    public function __construct()
    {
        $this->limit = (int) env('AI_SEARCH_LIMIT', 15);
    }

    /**
     * Tạo văn bản tổng hợp để embedding từ một sản phẩm
     */
    public function buildProductText(Product $product): string
    {
        return implode(' | ', array_filter([
            $product->product_name,
            $product->product_name_jp,
            $product->product_cd,
            $product->spec,
            $product->description,
            $product->origin,
            optional($product->category)->category_name,
            optional($product->supplier)->supplier_name,
        ]));
    }

    /**
     * Gọi OpenAI để lấy vector embedding cho một đoạn text
     */
    public function getEmbedding(string $text): array
    {
        $response = OpenAI::embeddings()->create([
            'model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
            'input' => $text,
        ]);

        return $response->embeddings[0]->embedding;
    }

    /**
     * Tạo và lưu embedding cho một sản phẩm
     */
    public function embedProduct(Product $product): void
    {
        $text      = $this->buildProductText($product);
        $embedding = $this->getEmbedding($text);

        $product->update([
            'embedding'            => $embedding,
            'embedding_updated_at' => now(),
        ]);
    }

    /**
     * Tìm kiếm sản phẩm bằng cosine similarity
     * Phù hợp cho catalog nhỏ (<5000 sản phẩm)
     */
    public function search(string $query, int $limit = null): array
    {
        $limit = $limit ?? $this->limit;

        // Chuyển câu tìm kiếm thành vector
        $queryVector = $this->getEmbedding($query);

        // Lấy tất cả sản phẩm có embedding, kèm ảnh
        $products = Product::query()
            ->with([
                'category:id,category_name',
                'supplier:id,supplier_name,supplier_name_jp',
                // Ảnh chính trước, sau đó ảnh phụ
                'images' => fn($q) => $q->orderByDesc('is_primary')->orderBy('order_no'),
            ])
            ->whereNotNull('embedding')
            ->where('disabled_flag', 0)
            ->whereNull('deleted_flag') // soft delete
            ->get(['id','product_cd','product_name','product_name_jp',
                   'spec','unit','cost_jpy','price_vnd','origin',
                   'import_tax_rate','image_path','embedding',
                   'product_category_id','supplier_id']);

        if ($products->isEmpty()) {
            return [];
        }

        // Tính cosine similarity cho từng sản phẩm
        $scored = $products->map(function ($product) use ($queryVector) {
            $productVector = $product->embedding; // cast json → array tự động
            $similarity    = $this->cosineSimilarity($queryVector, $productVector);

            return [
                'product'    => $product,
                'similarity' => $similarity,
            ];
        });

        // Sắp xếp theo score cao nhất, lấy top N
        return $scored
            ->sortByDesc('similarity')
            ->take($limit)
            ->values()
            ->map(fn($item) => $this->formatProduct($item['product'], $item['similarity']))
            ->all();
    }

    /**
     * Format output sản phẩm kèm hình ảnh
     */
    private function formatProduct(Product $product, float $similarity): array
    {
        // Ảnh chính
        $primaryImage = $product->images->firstWhere('is_primary', 1);
        $primaryImageUrl = $primaryImage
            ? $primaryImage->image_path
            : $product->image_path; // fallback về cột cũ

        return [
            'id'              => $product->id,
            'product_cd'      => $product->product_cd,
            'product_name'    => $product->product_name,
            'product_name_jp' => $product->product_name_jp,
            'spec'            => $product->spec,
            'unit'            => $product->unit,
            'cost_jpy'        => $product->cost_jpy,
            'price_vnd'       => $product->price_vnd,
            'origin'          => $product->origin,
            'import_tax_rate' => $product->import_tax_rate,
            'category'        => optional($product->category)->category_name,
            'supplier'        => optional($product->supplier)->supplier_name,
            // Hình ảnh
            'image_url'       => $primaryImageUrl,
            'images'          => $product->images->map(fn($img) => [
                'url'        => $img->image_path,
                'is_primary' => (bool) $img->is_primary,
                'order_no'   => $img->order_no,
            ])->values(),
            // Debug score (bỏ khi production)
            'ai_score'        => round($similarity, 4),
        ];
    }

    /**
     * Cosine similarity giữa 2 vector
     */
    private function cosineSimilarity(array $a, array $b): float
    {
        $dot    = 0.0;
        $normA  = 0.0;
        $normB  = 0.0;

        foreach ($a as $i => $val) {
            $dot   += $val * $b[$i];
            $normA += $val * $val;
            $normB += $b[$i] * $b[$i];
        }

        if ($normA === 0.0 || $normB === 0.0) {
            return 0.0;
        }

        return $dot / (sqrt($normA) * sqrt($normB));
    }
}
```

---

## Bước 4 — Artisan Command: tạo embedding hàng loạt

**File**: `app/Console/Commands/GenerateProductEmbeddings.php`

```php
<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\ProductEmbeddingService;
use Illuminate\Console\Command;

class GenerateProductEmbeddings extends Command
{
    protected $signature   = 'products:embed
                                {--force : Tạo lại embedding kể cả đã có}
                                {--id=  : Chỉ embed 1 sản phẩm theo ID}';

    protected $description = 'Tạo OpenAI embedding cho tất cả sản phẩm';

    public function handle(ProductEmbeddingService $service): int
    {
        $query = Product::query()
            ->where('disabled_flag', 0)
            ->whereNull('deleted_flag');

        if ($id = $this->option('id')) {
            $query->where('id', $id);
        } elseif (! $this->option('force')) {
            // Chỉ embed những sản phẩm chưa có hoặc chưa cập nhật
            $query->whereNull('embedding');
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->info('Không có sản phẩm nào cần embed.');
            return 0;
        }

        $this->info("Bắt đầu embed {$products->count()} sản phẩm...");
        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        $success = 0;
        $failed  = 0;

        foreach ($products as $product) {
            try {
                $service->embedProduct($product);
                $success++;
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error("Lỗi product #{$product->id}: {$e->getMessage()}");
            }

            $bar->advance();
            // Tránh rate limit OpenAI
            usleep(200_000); // 0.2 giây
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ Hoàn thành: {$success} thành công, {$failed} lỗi.");

        return 0;
    }
}
```

```bash
# Chạy lần đầu để embed tất cả sản phẩm hiện có
php artisan products:embed

# Embed lại tất cả (kể cả đã có)
php artisan products:embed --force

# Embed 1 sản phẩm cụ thể
php artisan products:embed --id=5
```

---

## Bước 5 — Observer: tự động embed khi tạo/sửa sản phẩm

**File**: `app/Observers/ProductObserver.php`

```php
<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\ProductEmbeddingService;
use Illuminate\Support\Facades\Log;

class ProductObserver
{
    public function __construct(private ProductEmbeddingService $service) {}

    public function saved(Product $product): void
    {
        // Chỉ re-embed khi các trường liên quan thay đổi
        $watched = ['product_name','product_name_jp','spec','description',
                    'product_category_id','supplier_id','origin'];

        $changed = array_intersect(array_keys($product->getDirty()), $watched);

        if (empty($changed) && $product->wasRecentlyCreated === false) {
            return;
        }

        try {
            $this->service->embedProduct($product);
        } catch (\Throwable $e) {
            Log::error("Embed thất bại product #{$product->id}: {$e->getMessage()}");
        }
    }
}
```

Đăng ký Observer trong `AppServiceProvider`:

```php
// app/Providers/AppServiceProvider.php
use App\Models\Product;
use App\Observers\ProductObserver;

public function boot(): void
{
    Product::observe(ProductObserver::class);
}
```

---

## Bước 6 — Search API Endpoint

**File**: `app/Http/Controllers/Api/AiProductSearchController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductEmbeddingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiProductSearchController extends Controller
{
    public function __construct(private ProductEmbeddingService $service) {}

    /**
     * POST /api/ai/product-search
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:2|max:200',
            'limit' => 'nullable|integer|min:10|max:20',
        ]);

        $results = $this->service->search(
            query: $request->input('query'),
            limit: $request->input('limit', 15),
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'query'   => $request->input('query'),
                'count'   => count($results),
                'items'   => $results,
            ],
            'message' => 'M0000',
            'errors'  => null,
        ]);
    }
}
```

**Route** — thêm vào `routes/api.php`:

```php
use App\Http\Controllers\Api\AiProductSearchController;

Route::middleware('auth:sanctum')->group(function () {
    // ... routes hiện có ...

    // AI Search
    Route::post('/ai/product-search', [AiProductSearchController::class, 'search']);
});
```

---

## Bước 7 — Model: thêm relationship images & cast embedding

**File**: `app/Models/Product.php` — thêm vào:

```php
// Casts
protected $casts = [
    'embedding'            => 'array',  // JSON → array tự động
    'embedding_updated_at' => 'datetime',
    'cost_jpy'             => 'integer',
    'price_vnd'            => 'integer',
    'disabled_flag'        => 'boolean',
    'deleted_flag'         => 'boolean',
    'require_flag'         => 'boolean',
    'import_tax_rate'      => 'decimal:2',
];

// Ẩn embedding khỏi response API (vector rất dài)
protected $hidden = ['embedding'];

// Relationships
public function category()
{
    return $this->belongsTo(ProductCategory::class, 'product_category_id');
}

public function supplier()
{
    return $this->belongsTo(SupplierJp::class, 'supplier_id');
}

public function images()
{
    return $this->hasMany(ProductImage::class, 'product_id')
                ->where('deleted_flag', 0)
                ->orderByDesc('is_primary')
                ->orderBy('order_no');
}
```

---

## Test API

```bash
# Test tìm kiếm
curl -X POST https://yourdomain.com/api/ai/product-search \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"query": "thuốc bổ gan nhật bản", "limit": 15}'
```

**Response mẫu**:
```json
{
  "success": true,
  "data": {
    "query": "thuốc bổ gan nhật bản",
    "count": 15,
    "items": [
      {
        "id": 3,
        "product_cd": "P003",
        "product_name": "Orihiro Liver Support",
        "product_name_jp": "肝臓サポート",
        "spec": "120 viên",
        "unit": "hộp",
        "cost_jpy": 2800,
        "price_vnd": 650000,
        "origin": "Nhật Bản",
        "category": "Thực phẩm chức năng",
        "supplier": "Orihiro JP",
        "image_url": "https://storage.../liver-support.jpg",
        "images": [
          {"url": "https://storage.../liver-support.jpg", "is_primary": true, "order_no": 0},
          {"url": "https://storage.../liver-support-2.jpg", "is_primary": false, "order_no": 1}
        ],
        "ai_score": 0.8921
      }
    ]
  }
}
```

---

## Lưu ý quan trọng

- **`ai_score`**: xóa khỏi response khi deploy production (chỉ để debug)
- **Embedding cost**: ~$0.0001/sản phẩm với `text-embedding-3-small` → 1000 sản phẩm ≈ $0.10
- **Khi catalog lớn >5000 sản phẩm**: chuyển sang Pinecone để search nhanh hơn
- **`deleted_flag`**: trong schema của bạn dùng `tinyint`, cần check `whereNull('deleted')` hoặc `where('deleted_flag', 0)` tùy convention dùng
