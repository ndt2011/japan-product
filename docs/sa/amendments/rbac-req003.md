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

## Cách implement trong Laravel

### Middleware

```php
// app/Http/Middleware/RoleMiddleware.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

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

Đăng ký trong `bootstrap/app.php` (Laravel 11) hoặc `Kernel.php` (Laravel 10):
```php
// Laravel 11 — bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\RoleMiddleware::class,
    ]);
})
```

### Dùng trong routes

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {

    // Cả 2 role
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/ai/product-search', [AiProductSearchController::class, 'search']);

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::apiResource('/suppliers', SupplierController::class)->except(['index', 'show']);
        Route::apiResource('/shipment-batches', ShipmentBatchController::class)->except(['index', 'show']);
        Route::prefix('admin')->group(function () {
            Route::apiResource('/admins', AdminManagementController::class);
            Route::apiResource('/companies', CompanyManagementController::class);
        });
    });

    // Company only
    Route::middleware('role:company')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::put('/orders/{id}', [OrderController::class, 'update']);
        Route::put('/orders/{id}/submit', [OrderController::class, 'submit']);
    });
});
```

### Auth service — phân biệt admin/company khi login

```php
// app/Services/AuthService.php
public function login(string $loginId, string $password): array
{
    // Thử tìm trong admins trước
    $admin = Admin::where('login_id', $loginId)->first();
    if ($admin && Hash::check($password, $admin->password)) {
        if ($admin->disabled_flag) {
            throw new AuthException('M0102'); // Tài khoản vô hiệu hóa
        }
        $token = $admin->createToken('api')->plainTextToken;
        return ['user_type' => 'admin', 'user' => $admin, 'token' => $token];
    }

    // Thử tìm trong companies_vn
    $company = CompanyVn::where('login_id', $loginId)->first();
    if ($company && Hash::check($password, $company->password)) {
        if ($company->disabled_flag) {
            throw new AuthException('M0102');
        }
        $token = $company->createToken('api')->plainTextToken;
        return ['user_type' => 'company', 'user' => $company, 'token' => $token];
    }

    throw new AuthException('M0101'); // Sai thông tin đăng nhập
}
```

> **Lưu ý**: Sanctum cần biết model nào để authenticate. Dùng `config/auth.php` với guards riêng cho admin/company, hoặc dùng polymorphic tokenable (Sanctum hỗ trợ sẵn).
