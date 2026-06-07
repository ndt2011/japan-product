# Migration Guide — Tất cả bảng còn thiếu

> **Chạy theo thứ tự số** để tránh lỗi FK constraint  
> Copy từng file vào `database/migrations/` rồi chạy `php artisan migrate`

---

## Thứ tự chạy

```
1. fix orders table (đổi order_status → status varchar)
2. add auth columns to companies_vn
3. create product_images
4. add embedding to products
5. create ai_search_sessions
6. create ai_product_candidates
7. create shipment_batches
8. create batch_order_items
```

---

## 1. Fix `orders` — đổi sang status varchar

**File**: `2026_06_07_100000_fix_orders_status_column.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Thêm cột mới trước
            $table->string('status', 20)->default('DRAFT')->after('order_no');
        });

        // Map giá trị cũ sang mới
        $map = [0 => 'DRAFT', 1 => 'PENDING', 2 => 'CONFIRMED', 3 => 'DELIVERED', 4 => 'CANCELLED'];
        foreach ($map as $old => $new) {
            DB::table('orders')->where('order_status', $old)->update(['status' => $new]);
        }

        Schema::table('orders', function (Blueprint $table) {
            // Xóa cột cũ
            $table->dropColumn('order_status');
        });

        // Index để filter nhanh
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->tinyInteger('order_status')->default(0)->after('order_no');
        });

        $map = ['DRAFT' => 0, 'PENDING' => 1, 'CONFIRMED' => 2,
                'PROCESSING' => 2, 'SHIPPED' => 2, 'DELIVERED' => 3, 'CANCELLED' => 4];
        foreach ($map as $new => $old) {
            DB::table('orders')->where('status', $new)->update(['order_status' => $old]);
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};
```

---

## 2. Add auth columns to `companies_vn`

**File**: `2026_06_07_100001_add_auth_columns_to_companies_vn_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies_vn', function (Blueprint $table) {
            $table->string('login_id', 50)->nullable()->unique()->after('company_cd');
            $table->string('password', 255)->nullable()->after('login_id');
        });
    }

    public function down(): void
    {
        Schema::table('companies_vn', function (Blueprint $table) {
            $table->dropUnique(['login_id']);
            $table->dropColumn(['login_id', 'password']);
        });
    }
};
```

---

## 3. Create `product_images`

**File**: `2026_06_07_100002_create_product_images_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('product_id');
            $table->string('image_path', 500);
            $table->tinyInteger('is_primary')->default(0)->comment('1: ảnh chính');
            $table->integer('order_no')->default(0)->comment('Thứ tự trong gallery');
            $table->datetime('created')->nullable();
            $table->unsignedInteger('created_user_id')->nullable();
            $table->datetime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);

            $table->foreign('product_id')
                  ->references('id')->on('products')
                  ->onDelete('cascade');

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

## 4. Add embedding to `products`

**File**: `2026_06_07_100003_add_embedding_to_products_table.php`

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

---

## 5. Create `ai_search_sessions`

**File**: `2026_06_07_100004_create_ai_search_sessions_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_search_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('keyword', 500);
            $table->string('status', 20)->default('processing')
                  ->comment('processing|completed|failed|timeout');
            $table->string('user_type', 20)->comment('admin|company');
            $table->unsignedBigInteger('user_id');
            $table->json('results_json')->nullable()->comment('Mảng kết quả tối đa 10 item');
            $table->text('error_message')->nullable();
            $table->datetime('created');
            $table->datetime('completed_at')->nullable();

            $table->index(['user_type', 'user_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_search_sessions');
    }
};
```

---

## 6. Create `ai_product_candidates`

**File**: `2026_06_07_100005_create_ai_product_candidates_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_product_candidates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ai_search_session_id')->nullable();
            $table->string('product_name_jp', 255);
            $table->string('product_name_vn', 255)->nullable();
            $table->string('image_url', 500)->nullable();
            $table->unsignedInteger('price_jpy')->nullable();
            $table->string('source_url', 500)->nullable();
            $table->string('source_platform', 50)->nullable()->comment('rakuten|amazon');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('PENDING')
                  ->comment('PENDING|APPROVED|REJECTED');
            $table->text('reject_reason')->nullable()->comment('Bắt buộc ≥10 ký tự khi reject');
            $table->unsignedBigInteger('product_id')->nullable()->comment('Sau khi approve');
            $table->string('created_user_type', 20);
            $table->unsignedBigInteger('created_user_id');
            $table->string('reviewed_user_type', 20)->nullable();
            $table->unsignedBigInteger('reviewed_user_id')->nullable();
            $table->datetime('created');
            $table->datetime('modified')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);

            $table->foreign('ai_search_session_id')
                  ->references('id')->on('ai_search_sessions')
                  ->onDelete('set null');

            $table->index('status');
            $table->index(['created_user_type', 'created_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_product_candidates');
    }
};
```

---

## 7. Create `shipment_batches`

**File**: `2026_06_07_100006_create_shipment_batches_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipment_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_no', 50)->unique()
                  ->comment('Format: BAT-YYYYMMDD-####');
            $table->string('batch_name', 255);
            $table->string('status', 30)->default('PREPARING')
                  ->comment('PREPARING|CUSTOMS_JP|IN_TRANSIT|CUSTOMS_VN|DELIVERED');
            $table->string('logistics_partner', 255)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->date('estimated_departure_date')->nullable();
            $table->unsignedInteger('created_admin_id');
            $table->datetime('created');
            $table->datetime('modified')->nullable();
            $table->boolean('deleted_flag')->default(false);

            $table->foreign('created_admin_id')
                  ->references('id')->on('admins');

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_batches');
    }
};
```

---

## 8. Create `batch_order_items`

**File**: `2026_06_07_100007_create_batch_order_items_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shipment_batch_id');
            $table->unsignedInteger('order_id');
            $table->datetime('created');

            $table->foreign('shipment_batch_id')
                  ->references('id')->on('shipment_batches')
                  ->onDelete('cascade');

            $table->foreign('order_id')
                  ->references('id')->on('orders');

            // RULE-BATCH-02: Một đơn chỉ thuộc 1 chuyến active
            $table->unique('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_order_items');
    }
};
```

---

## Chạy tất cả

```bash
php artisan migrate

# Kiểm tra kết quả
php artisan migrate:status
```

---

## Sau khi migrate — Đăng ký Observer & Command

**`app/Providers/AppServiceProvider.php`**:
```php
use App\Models\Product;
use App\Observers\ProductObserver;

public function boot(): void
{
    Product::observe(ProductObserver::class);
}
```

**`app/Console/Kernel.php`** — đăng ký artisan command:
```php
protected $commands = [
    \App\Console\Commands\GenerateProductEmbeddings::class,
];
```

**Chạy embed lần đầu sau migrate**:
```bash
php artisan products:embed
```

---

## Tổng số bảng sau khi migrate xong

| # | Bảng | Trạng thái |
|---|------|-----------|
| 1 | admins | ✅ Có sẵn |
| 2 | companies_vn | ✅ + login_id/password |
| 3 | suppliers_jp | ✅ Có sẵn |
| 4 | product_categories | ✅ Có sẵn |
| 5 | products | ✅ + embedding |
| 6 | product_images | ✅ Migration mới |
| 7 | warehouses | ✅ Có sẵn |
| 8 | inventories | ✅ Có sẵn |
| 9 | orders | ✅ + status varchar |
| 10 | order_details | ✅ Có sẵn |
| 11 | exchange_rates | ✅ Có sẵn |
| 12 | import_declarations | ✅ Có sẵn |
| 13 | mail_templates | ✅ Có sẵn |
| 14 | mail_histories | ✅ Có sẵn |
| 15 | ai_search_sessions | ✅ Migration mới |
| 16 | ai_product_candidates | ✅ Migration mới |
| 17 | shipment_batches | ✅ Migration mới |
| 18 | batch_order_items | ✅ Migration mới |
