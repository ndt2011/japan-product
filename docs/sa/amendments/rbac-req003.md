# Amendment — RBAC (Role-Based Access Control)

> **Ngày**: 2026-06-07 | **Ticket**: S1 RBAC  
> **Trạng thái**: ⏸ Tạm áp dụng — chờ SA REQ-003 chính thức  
> **Áp dụng ngay** để không block BE development

---

## Vấn đề

SA chưa có REQ-003 mô tả phân quyền chính thức. Tài liệu này là amendment tạm để dev code được, sẽ được thay bằng SA chính thức khi có.

---

## Phân quyền hiện tại (2 role)

| Role | Bảng | Mô tả |
|------|------|-------|
| `admin` | `admins` | Admin phía Nhật — quản lý toàn hệ thống |
| `company` | `companies_vn` | Công ty VN — chỉ thao tác dữ liệu của mình |

---

## Ma trận quyền theo module

### Auth
| Endpoint | admin | company |
|----------|-------|---------|
| POST `/auth/login` | ✅ | ✅ |
| POST `/auth/logout` | ✅ | ✅ |
| GET `/auth/me` | ✅ | ✅ |

### Products
| Endpoint | admin | company |
|----------|-------|---------|
| GET `/products` | ✅ | ✅ |
| GET `/products/{id}` | ✅ | ✅ |
| POST `/products` | ✅ | ❌ |
| PUT `/products/{id}` | ✅ | ❌ |
| DELETE `/products/{id}` | ✅ | ❌ |
| POST `/products/{id}/images` | ✅ | ❌ |
| DELETE `/products/{id}/images/{imgId}` | ✅ | ❌ |

### AI Search
| Endpoint | admin | company |
|----------|-------|---------|
| POST `/ai/search` | ✅ | ✅ |
| GET `/ai/search/{id}` | ✅ | ✅ (session của mình) |
| POST `/ai/candidates` | ✅ | ❌ |
| GET `/ai/candidates` | ✅ | ❌ |
| PUT `/ai/candidates/{id}/approve` | ✅ | ❌ |
| PUT `/ai/candidates/{id}/reject` | ✅ | ❌ |
| POST `/ai/product-search` | ✅ | ✅ |

### Orders
| Endpoint | admin | company |
|----------|-------|---------|
| GET `/orders` | ✅ (tất cả) | ✅ (của mình) |
| POST `/orders` | ❌ | ✅ |
| GET `/orders/{id}` | ✅ | ✅ (của mình) |
| PUT `/orders/{id}` | ❌ | ✅ (DRAFT + của mình) |
| PUT `/orders/{id}/submit` | ❌ | ✅ (của mình) |
| PUT `/orders/{id}/confirm` | ✅ | ❌ |
| PUT `/orders/{id}/cancel` | ✅ | ✅ (DRAFT/PENDING + của mình) |

### Shipment Batches
| Endpoint | admin | company |
|----------|-------|---------|
| GET `/shipment-batches` | ✅ (tất cả) | ✅ (chuyến có đơn của mình) |
| GET `/shipment-batches/available-orders` | ✅ | ❌ |
| POST `/shipment-batches` | ✅ | ❌ |
| GET `/shipment-batches/{id}` | ✅ | ✅ (có đơn của mình) |
| PUT `/shipment-batches/{id}` | ✅ | ❌ |
| PUT `/shipment-batches/{id}/status` | ✅ | ❌ |

### Suppliers
| Endpoint | admin | company |
|----------|-------|---------|
| GET `/suppliers` | ✅ | ✅ |
| GET `/suppliers/{id}` | ✅ | ✅ |
| POST `/suppliers` | ✅ | ❌ |
| PUT `/suppliers/{id}` | ✅ | ❌ |
| DELETE `/suppliers/{id}` | ✅ | ❌ |

### Các module còn lại
| Endpoint | admin | company |
|----------|-------|---------|
| GET `/import-declarations` | ✅ | ❌ |
| POST/PUT `/import-declarations` | ✅ | ❌ |
| GET/POST `/exchange-rates` | ✅ | ✅ (GET only) |
| Tất cả `/admin/*` | ✅ | ❌ |

---

## Cách implement trong Laravel — Hướng dẫn đầy đủ

---

### ⚠️ Root cause — Tại sao RBAC bị lỗi

Sanctum mặc định chỉ biết 1 model (`User` từ bảng `users`). Hệ thống này dùng **2 model riêng** (`Admin` + `CompanyVn`) nên cần thêm 3 thứ:

1. Cả 2 model phải có trait `HasApiTokens` + accessor `user_type`
2. `config/auth.php` phải khai báo provider cho từng model
3. Password khi tạo user **phải hash** bằng `bcrypt()` — nếu không hash thì `Hash::check()` sẽ luôn fail

---

### Bước 1 — Model Admin

**File**: `app/Models/Admin.php`

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'admins';

    protected $hidden = ['password'];

    protected $casts = [
        'disabled_flag' => 'boolean',
        'deleted_flag'  => 'boolean',
    ];

    /**
     * Accessor: $admin->user_type → "admin"
     * RoleMiddleware dùng cái này để check quyền
     */
    public function getUserTypeAttribute(): string
    {
        return 'admin';
    }
}
```

---

### Bước 2 — Model CompanyVn

**File**: `app/Models/CompanyVn.php`

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class CompanyVn extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'companies_vn';

    protected $hidden = ['password'];

    protected $casts = [
        'disabled_flag' => 'boolean',
        'deleted_flag'  => 'boolean',
    ];

    /**
     * Accessor: $company->user_type → "company"
     */
    public function getUserTypeAttribute(): string
    {
        return 'company';
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'company_vn_id');
    }
}
```

---

### Bước 3 — config/auth.php

Thêm 2 provider để Sanctum biết resolve model nào từ token:

```php
// config/auth.php
'guards' => [
    'sanctum' => [
        'driver'   => 'sanctum',
        'provider' => null,   // Sanctum tự resolve qua tokenable_type
    ],
],

'providers' => [
    // Xóa hoặc giữ provider 'users' mặc định (không cần thiết)
    'admins' => [
        'driver' => 'eloquent',
        'model'  => App\Models\Admin::class,
    ],
    'companies' => [
        'driver' => 'eloquent',
        'model'  => App\Models\CompanyVn::class,
    ],
],
```

> **Quan trọng**: Sanctum dùng **polymorphic tokenable** — bảng `personal_access_tokens` có `tokenable_type` (tên class) và `tokenable_id`. Khi request gửi token, Sanctum tự tìm đúng model. Không cần guard riêng cho từng model.

---

### Bước 4 — AuthService (login đúng)

**File**: `app/Services/AuthService.php`

```php
<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\CompanyVn;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function login(string $loginId, string $password, bool $rememberMe = false): array
    {
        $tokenName = 'api-token';
        $expiry    = $rememberMe
            ? now()->addDays(30)
            : now()->addHours(24);

        // 1. Tìm trong admins
        $admin = Admin::where('login_id', $loginId)
                      ->where('deleted_flag', 0)
                      ->first();

        if ($admin && Hash::check($password, $admin->password)) {
            if ($admin->disabled_flag) {
                throw new \Exception('M0102');
            }
            $token = $admin->createToken($tokenName, ['*'], $expiry);
            return [
                'user'       => $admin,
                'user_type'  => 'admin',
                'token'      => $token->plainTextToken,
                'expires_at' => $expiry->toIso8601String(),
            ];
        }

        // 2. Tìm trong companies_vn
        $company = CompanyVn::where('login_id', $loginId)
                            ->where('deleted_flag', 0)
                            ->first();

        if ($company && Hash::check($password, $company->password)) {
            if ($company->disabled_flag) {
                throw new \Exception('M0102');
            }
            $token = $company->createToken($tokenName, ['*'], $expiry);
            return [
                'user'       => $company,
                'user_type'  => 'company',
                'token'      => $token->plainTextToken,
                'expires_at' => $expiry->toIso8601String(),
            ];
        }

        throw new \Exception('M0101');
    }
}
```

---

### Bước 5 — RoleMiddleware (không đổi, nhưng cần model đã có accessor)

**File**: `app/Http/Middleware/RoleMiddleware.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user(); // Sanctum tự resolve Admin hoặc CompanyVn

        if (! $user || ! in_array($user->user_type, $roles)) {
            return response()->json([
                'success' => false,
                'data'    => null,
                'message' => 'M0403_FORBIDDEN',
                'errors'  => ['Không có quyền truy cập'],
            ], 403);
        }

        return $next($request);
    }
}
```

**Đăng ký** trong `bootstrap/app.php` (Laravel 11):
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\RoleMiddleware::class,
    ]);
})
```

---

### Bước 6 — Tạo company user đúng cách (fix lỗi không login được)

**Vấn đề phổ biến**: Lưu password plain text → `Hash::check()` luôn fail → không login được.

**File**: `app/Http/Controllers/Api/Admin/CompanyManagementController.php`

```php
<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanyVn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CompanyManagementController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_cd'   => 'nullable|string|max:50',
            'company_name' => 'required|string|max:255',
            'login_id'     => 'required|string|max:50|unique:companies_vn,login_id',
            'password'     => 'required|string|min:8',
            'address'      => 'nullable|string',
            'province'     => 'nullable|string|max:100',
            'tel'          => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'tax_code'     => 'nullable|string|max:20',
            'contact_name' => 'nullable|string|max:100',
            'memo'         => 'nullable|string',
        ]);

        // ✅ BẮT BUỘC hash password
        $data['password']         = Hash::make($data['password']);
        $data['created']          = now();
        $data['created_user_id']  = $request->user()->id;

        $company = CompanyVn::create($data);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'           => $company->id,
                'company_name' => $company->company_name,
                'login_id'     => $company->login_id,
            ],
            'message' => 'M0903',
            'errors'  => null,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $company = CompanyVn::findOrFail($id);

        $data = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'address'      => 'nullable|string',
            'tel'          => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'contact_name' => 'nullable|string|max:100',
            'disabled_flag'=> 'sometimes|boolean',
            'memo'         => 'nullable|string',
            // Đổi password (optional)
            'password'     => 'sometimes|string|min:8',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']); // ✅ hash
        }

        $data['modified']         = now();
        $data['modified_user_id'] = $request->user()->id;

        $company->update($data);

        return response()->json([
            'success' => true,
            'data'    => ['id' => $company->id],
            'message' => 'M0903',
            'errors'  => null,
        ]);
    }
}
```

---

### Bước 7 — AdminManagementController (tương tự, hash password)

**File**: `app/Http/Controllers/Api/Admin/AdminManagementController.php`

```php
public function store(Request $request): JsonResponse
{
    $data = $request->validate([
        'login_id'  => 'required|string|max:50|unique:admins,login_id',
        'password'  => 'required|string|min:8',
        'full_name' => 'required|string|max:100',
        'email'     => 'required|email|max:255',
    ]);

    $data['password']        = Hash::make($data['password']); // ✅ hash
    $data['created']         = now();
    $data['created_user_id'] = $request->user()->id;

    $admin = Admin::create($data);

    return response()->json([
        'success' => true,
        'data'    => ['id' => $admin->id, 'login_id' => $admin->login_id],
        'message' => 'M0901',
        'errors'  => null,
    ], 201);
}

public function resetPassword(Request $request, int $id): JsonResponse
{
    $admin = Admin::findOrFail($id);

    $request->validate([
        'new_password' => 'required|string|min:8',
    ]);

    $admin->update([
        'password'         => Hash::make($request->new_password), // ✅ hash
        'modified'         => now(),
        'modified_user_id' => $request->user()->id,
    ]);

    return response()->json(['success' => true, 'data' => null, 'message' => 'M0000']);
}
```

---

### Bước 8 — Routes đầy đủ

**File**: `routes/api.php`

```php
use App\Http\Controllers\Api\Admin\AdminManagementController;
use App\Http\Controllers\Api\Admin\CompanyManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ShipmentBatchController;
use App\Http\Controllers\Api\SupplierController;

// Public
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/health',      fn() => response()->json(['status' => 'ok']));

// Authenticated
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // ── Cả 2 role ──────────────────────────────────────────
    Route::get('/products',             [ProductController::class, 'index']);
    Route::get('/products/{id}',        [ProductController::class, 'show']);
    Route::get('/suppliers',            [SupplierController::class, 'index']);
    Route::get('/suppliers/{id}',       [SupplierController::class, 'show']);
    Route::get('/product-categories',   [\App\Http\Controllers\Api\ProductCategoryController::class, 'index']);
    Route::get('/exchange-rates/current', [\App\Http\Controllers\Api\ExchangeRateController::class, 'current']);
    Route::post('/ai/product-search',   [\App\Http\Controllers\Api\AiProductSearchController::class, 'search']);
    Route::post('/ai/search',           [\App\Http\Controllers\Api\AiSearchController::class, 'start']);
    Route::get('/ai/search/{id}',       [\App\Http\Controllers\Api\AiSearchController::class, 'status']);
    Route::get('/orders',               [OrderController::class, 'index']);
    Route::get('/orders/{id}',          [OrderController::class, 'show']);
    Route::get('/shipment-batches',     [ShipmentBatchController::class, 'index']);
    Route::get('/shipment-batches/{id}',[ShipmentBatchController::class, 'show']);

    // ── Admin only ──────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        // Products
        Route::post('/products',          [ProductController::class, 'store']);
        Route::put('/products/{id}',      [ProductController::class, 'update']);
        Route::delete('/products/{id}',   [ProductController::class, 'destroy']);
        Route::post('/products/{id}/images',              [\App\Http\Controllers\Api\ProductImageController::class, 'store']);
        Route::put('/products/{id}/images/{imgId}',       [\App\Http\Controllers\Api\ProductImageController::class, 'update']);
        Route::delete('/products/{id}/images/{imgId}',    [\App\Http\Controllers\Api\ProductImageController::class, 'destroy']);

        // Suppliers
        Route::post('/suppliers',         [SupplierController::class, 'store']);
        Route::put('/suppliers/{id}',     [SupplierController::class, 'update']);
        Route::delete('/suppliers/{id}',  [SupplierController::class, 'destroy']);

        // Orders (admin actions)
        Route::put('/orders/{id}/confirm',  [OrderController::class, 'confirm']);
        Route::put('/orders/{id}/cancel',   [OrderController::class, 'cancel']);

        // Shipment Batches
        Route::get('/shipment-batches/available-orders',      [ShipmentBatchController::class, 'availableOrders']);
        Route::post('/shipment-batches',                      [ShipmentBatchController::class, 'store']);
        Route::put('/shipment-batches/{id}',                  [ShipmentBatchController::class, 'update']);
        Route::put('/shipment-batches/{id}/status',           [ShipmentBatchController::class, 'updateStatus']);

        // AI candidates
        Route::post('/ai/candidates',                 [\App\Http\Controllers\Api\AiCandidateController::class, 'store']);
        Route::get('/ai/candidates',                  [\App\Http\Controllers\Api\AiCandidateController::class, 'index']);
        Route::put('/ai/candidates/{id}/approve',     [\App\Http\Controllers\Api\AiCandidateController::class, 'approve']);
        Route::put('/ai/candidates/{id}/reject',      [\App\Http\Controllers\Api\AiCandidateController::class, 'reject']);

        // Import Declarations
        Route::apiResource('/import-declarations', \App\Http\Controllers\Api\ImportDeclarationController::class);
        Route::post('/import-declarations/{id}/upload-file', [\App\Http\Controllers\Api\ImportDeclarationController::class, 'uploadFile']);

        // Exchange Rates
        Route::get('/exchange-rates',   [\App\Http\Controllers\Api\ExchangeRateController::class, 'index']);
        Route::post('/exchange-rates',  [\App\Http\Controllers\Api\ExchangeRateController::class, 'store']);

        // Admin management
        Route::prefix('admin')->group(function () {
            Route::get('/admins',                          [AdminManagementController::class, 'index']);
            Route::post('/admins',                         [AdminManagementController::class, 'store']);
            Route::put('/admins/{id}',                     [AdminManagementController::class, 'update']);
            Route::put('/admins/{id}/reset-password',      [AdminManagementController::class, 'resetPassword']);
            Route::get('/companies',                       [CompanyManagementController::class, 'index']);
            Route::post('/companies',                      [CompanyManagementController::class, 'store']);
            Route::put('/companies/{id}',                  [CompanyManagementController::class, 'update']);
            Route::put('/companies/{id}/toggle',           [CompanyManagementController::class, 'toggle']);
        });
    });

    // ── Company only ────────────────────────────────────────
    Route::middleware('role:company')->group(function () {
        Route::post('/orders',                [OrderController::class, 'store']);
        Route::put('/orders/{id}',            [OrderController::class, 'update']);
        Route::put('/orders/{id}/submit',     [OrderController::class, 'submit']);
        Route::put('/orders/{id}/cancel',     [OrderController::class, 'cancel']);
    });
});
```

---

### Checklist debug nhanh khi RBAC lỗi

| Triệu chứng | Nguyên nhân | Fix |
|-------------|-------------|-----|
| Login 401 dù đúng mật khẩu | Password lưu plain text | Tạo lại user với `Hash::make()` |
| Login OK nhưng `auth:sanctum` trả 401 | Model không có `HasApiTokens` | Thêm trait vào `Admin`/`CompanyVn` |
| `$user->user_type` là null | Thiếu accessor `getUserTypeAttribute()` | Thêm method vào model |
| Role:admin trả 403 dù là admin | `user_type` accessor sai tên | Check `getUserTypeAttribute` trả đúng `'admin'` |
| Company tạo được đơn hàng của admin | Routes chưa có `role:company` middleware | Bọc route trong group `role:company` |

---

### Tạo user test nhanh (Tinker)

```bash
php artisan tinker

# Tạo admin test
App\Models\Admin::create([
    'login_id'  => 'test_admin',
    'password'  => bcrypt('Admin@123'),
    'full_name' => 'Test Admin',
    'email'     => 'admin@test.local',
    'created'   => now(),
]);

# Tạo company test
App\Models\CompanyVn::create([
    'login_id'     => 'test_company',
    'password'     => bcrypt('Company@123'),
    'company_name' => 'Công ty Test',
    'created'      => now(),
]);

# Verify login
$admin = App\Models\Admin::where('login_id', 'test_admin')->first();
echo Hash::check('Admin@123', $admin->password); // phải ra true
echo $admin->user_type; // phải ra "admin"
```
