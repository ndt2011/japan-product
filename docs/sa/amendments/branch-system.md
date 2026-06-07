# Amendment — Hệ thống Chi nhánh (Branch System)

> **Ngày**: 2026-06-07 | **Trạng thái**: Thiết kế mới — chờ SA chính thức  
> **Phạm vi**: DB mới + RBAC mới + API mới + Admin dashboard

---

## Yêu cầu nghiệp vụ

| # | Yêu cầu |
|---|---------|
| 1 | Chi nhánh **độc lập** — không phụ thuộc companies_vn, có vùng miền / tỉnh thành |
| 2 | **2 cấp quyền**: Branch Manager (tạo được user) + Branch Staff (chỉ xem/đặt hàng) |
| 3 | Branch user xem **toàn bộ catalog SP** nhưng chỉ thấy **đơn hàng của chi nhánh mình** |
| 4 | Admin thấy: sản phẩm đang có ở chi nhánh nào, số lượng đã order, số lượng tồn kho |

---

## Phân tích tác động hệ thống

```
Trước:   Admin ←→ CompanyVn ←→ Orders
Sau:     Admin ←→ CompanyVn ←→ Orders
                       ↕
                   Branch ←→ BranchUser(Manager/Staff) ←→ Orders
```

**3 loại tài khoản** thay vì 2:

| Model | Bảng | user_type | Quyền |
|-------|------|-----------|-------|
| Admin | `admins` | `admin` | Toàn bộ hệ thống |
| CompanyVn | `companies_vn` | `company` | Đơn hàng của công ty |
| BranchUser | `branch_users` | `branch_manager` / `branch_staff` | Đơn hàng của chi nhánh |

---

## 1. Database — Bảng mới

### Bảng `branches`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | int unsigned PK | |
| branch_cd | varchar(50) unique | Mã chi nhánh: `CN-HN-01` |
| branch_name | varchar(255) | Tên chi nhánh |
| region | varchar(50) | Miền: `Bắc` / `Trung` / `Nam` |
| province | varchar(100) | Tỉnh/thành: `Hà Nội`, `TP.HCM` |
| address | text nullable | Địa chỉ cụ thể |
| tel | varchar(20) nullable | Điện thoại |
| disabled_flag | tinyint(1) default 0 | |
| created | datetime | |
| created_user_id | int | Admin tạo |
| modified | datetime nullable | |
| modified_user_id | int nullable | |
| deleted | datetime nullable | |
| deleted_flag | tinyint(1) default 0 | |

### Bảng `branch_users`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | int unsigned PK | |
| branch_id | int FK → branches | |
| login_id | varchar(100) unique | |
| password | varchar(255) | bcrypt hash |
| full_name | varchar(150) | |
| email | varchar(255) nullable | |
| role | varchar(20) | `manager` / `staff` |
| disabled_flag | tinyint(1) default 0 | |
| created | datetime | |
| created_user_id | int | Admin hoặc Manager tạo |
| modified | datetime nullable | |
| modified_user_id | int nullable | |
| deleted | datetime nullable | |
| deleted_flag | tinyint(1) default 0 | |

### Cập nhật bảng `orders` — thêm branch_id

```sql
ALTER TABLE orders ADD COLUMN branch_id INT UNSIGNED NULL AFTER company_vn_id;
ALTER TABLE orders ADD CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches(id);
-- NOTE: company_vn_id hoặc branch_id, không null cả hai
```

**Rule**: Mỗi order phải có EITHER `company_vn_id` OR `branch_id` (không phải cả hai, không phải null cả hai).

---

## 2. Migrations

### `2026_06_07_220000_create_branches_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('branch_cd', 50)->unique();
            $table->string('branch_name', 255);
            $table->string('region', 50)->comment('Bắc|Trung|Nam');
            $table->string('province', 100);
            $table->text('address')->nullable();
            $table->string('tel', 20)->nullable();
            $table->tinyInteger('disabled_flag')->default(0);
            $table->datetime('created');
            $table->unsignedInteger('created_user_id');
            $table->datetime('modified')->nullable();
            $table->unsignedInteger('modified_user_id')->nullable();
            $table->datetime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);
            $table->index(['region', 'province']);
            $table->index('deleted_flag');
        });
    }
    public function down(): void { Schema::dropIfExists('branches'); }
};
```

### `2026_06_07_220001_create_branch_users_table.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branch_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id');
            $table->string('login_id', 100)->unique();
            $table->string('password', 255);
            $table->string('full_name', 150);
            $table->string('email', 255)->nullable();
            $table->string('role', 20)->comment('manager|staff');
            $table->tinyInteger('disabled_flag')->default(0);
            $table->datetime('created');
            $table->unsignedInteger('created_user_id');
            $table->datetime('modified')->nullable();
            $table->unsignedInteger('modified_user_id')->nullable();
            $table->datetime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);

            $table->foreign('branch_id')->references('id')->on('branches');
            $table->index(['branch_id', 'deleted_flag']);
        });
    }
    public function down(): void { Schema::dropIfExists('branch_users'); }
};
```

### `2026_06_07_220002_add_branch_id_to_orders.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('company_vn_id');
            $table->foreign('branch_id')->references('id')->on('branches');
            $table->index('branch_id');
        });
    }
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
```

---

## 3. Models

### BranchUser — Authenticatable thứ 3

**File**: `app/Models/BranchUser.php`

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class BranchUser extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'branch_users';

    protected $hidden = ['password'];

    protected $casts = [
        'disabled_flag' => 'boolean',
        'deleted_flag'  => 'boolean',
    ];

    /**
     * user_type phụ thuộc vào $this->role
     * 'manager' → 'branch_manager'
     * 'staff'   → 'branch_staff'
     */
    public function getUserTypeAttribute(): string
    {
        return 'branch_' . $this->role; // 'branch_manager' hoặc 'branch_staff'
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'branch_id', 'branch_id');
        // Trả về TẤT CẢ đơn của chi nhánh này, không chỉ đơn user này tạo
    }
}
```

### Branch model

**File**: `app/Models/Branch.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    public $timestamps = false;

    protected $table = 'branches';

    protected $fillable = [
        'branch_cd', 'branch_name', 'region', 'province',
        'address', 'tel', 'disabled_flag',
        'created', 'created_user_id', 'modified', 'modified_user_id',
    ];

    protected $casts = ['disabled_flag' => 'boolean', 'deleted_flag' => 'boolean'];

    public function users()
    {
        return $this->hasMany(BranchUser::class)->where('deleted_flag', 0);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'branch_id');
    }
}
```

---

## 4. AuthService — cập nhật thêm branch_users

```php
// app/Services/AuthService.php

use App\Models\BranchUser;

public function login(string $loginId, string $password, bool $rememberMe = false): array
{
    $expiry = $rememberMe ? now()->addDays(30) : now()->addHours(24);

    // 1. Tìm Admin
    $admin = Admin::where('login_id', $loginId)->where('deleted_flag', 0)->first();
    if ($admin && Hash::check($password, $admin->password)) {
        if ($admin->disabled_flag) throw new \Exception('M0102');
        return $this->makeTokenResponse($admin, $expiry);
    }

    // 2. Tìm CompanyVn
    $company = CompanyVn::where('login_id', $loginId)->where('deleted_flag', 0)->first();
    if ($company && Hash::check($password, $company->password)) {
        if ($company->disabled_flag) throw new \Exception('M0102');
        return $this->makeTokenResponse($company, $expiry);
    }

    // 3. Tìm BranchUser (MỚI)
    $branchUser = BranchUser::where('login_id', $loginId)->where('deleted_flag', 0)->first();
    if ($branchUser && Hash::check($password, $branchUser->password)) {
        if ($branchUser->disabled_flag) throw new \Exception('M0102');
        return $this->makeTokenResponse($branchUser, $expiry, [
            'branch_id'   => $branchUser->branch_id,
            'branch_name' => $branchUser->branch->branch_name ?? null,
            'role'        => $branchUser->role,
        ]);
    }

    throw new \Exception('M0101');
}

private function makeTokenResponse($user, $expiry, array $extra = []): array
{
    $token = $user->createToken('api-token', ['*'], $expiry);
    return array_merge([
        'user'       => $user,
        'user_type'  => $user->user_type,
        'token'      => $token->plainTextToken,
        'expires_at' => $expiry->toIso8601String(),
    ], $extra);
}
```

---

## 5. RoleMiddleware — cập nhật

```php
// app/Http/Middleware/RoleMiddleware.php

public function handle(Request $request, Closure $next, string ...$roles): mixed
{
    $user = $request->user();

    if (! $user) {
        return response()->json(['success' => false, 'message' => 'M0401_UNAUTHORIZED'], 401);
    }

    // Hỗ trợ wildcard: 'branch' khớp với cả 'branch_manager' và 'branch_staff'
    $allowed = false;
    foreach ($roles as $role) {
        if ($role === 'branch' && str_starts_with($user->user_type, 'branch_')) {
            $allowed = true; break;
        }
        if ($user->user_type === $role) {
            $allowed = true; break;
        }
    }

    if (! $allowed) {
        return response()->json(['success' => false, 'message' => 'M0403_FORBIDDEN'], 403);
    }

    return $next($request);
}
```

**Dùng trong routes**:
```php
Route::middleware('role:admin')            // chỉ admin
Route::middleware('role:company')          // chỉ company
Route::middleware('role:branch_manager')   // chỉ branch manager
Route::middleware('role:branch')           // cả manager lẫn staff
Route::middleware('role:admin,branch_manager') // admin hoặc branch manager
```

---

## 6. API Endpoints mới

### Branches (Admin quản lý)

| Method | URL | Quyền | Mô tả |
|--------|-----|-------|-------|
| GET | `/branches` | Admin | Danh sách chi nhánh (filter: region, province) |
| POST | `/branches` | Admin | Tạo chi nhánh mới |
| GET | `/branches/{id}` | Admin | Chi tiết + danh sách users |
| PUT | `/branches/{id}` | Admin | Cập nhật thông tin |
| PUT | `/branches/{id}/toggle` | Admin | Bật/tắt chi nhánh |

### Branch Users

| Method | URL | Quyền | Mô tả |
|--------|-----|-------|-------|
| GET | `/branches/{id}/users` | Admin + Branch Manager (của mình) | Danh sách user của chi nhánh |
| POST | `/branches/{id}/users` | Admin + Branch Manager (của mình) | Tạo user mới trong chi nhánh |
| PUT | `/branches/{id}/users/{userId}` | Admin + Branch Manager | Cập nhật user |
| PUT | `/branches/{id}/users/{userId}/toggle` | Admin + Branch Manager | Bật/tắt user |

> **Branch Manager chỉ quản lý được chi nhánh của mình**: BE check `$user->branch_id === $branchId`

### Orders — Branch user tạo đơn

`POST /orders` — giữ nguyên, nhưng nếu user là branch → tự động set `branch_id`:

```php
// OrderController::store
$user = auth()->user();

if ($user->user_type === 'admin') {
    // Admin không tạo đơn
    return response()->json(['success' => false, 'message' => 'M0403_FORBIDDEN'], 403);
}

$branchId   = null;
$companyId  = null;

if (str_starts_with($user->user_type, 'branch_')) {
    $branchId = $user->branch_id;  // lấy từ model BranchUser
} else {
    $companyId = $user->id;        // company tạo đơn
}

Order::create([
    'company_vn_id' => $companyId,
    'branch_id'     => $branchId,
    // ...
]);
```

### Admin — Xem sản phẩm theo chi nhánh

**GET `/products/{id}/branch-stats`** — Admin only

```json
{
  "success": true,
  "data": {
    "product_id": 3,
    "product_name": "Vitamin C Orihiro",
    "branches": [
      {
        "branch_id": 1,
        "branch_name": "Chi nhánh Hà Nội",
        "region": "Bắc",
        "province": "Hà Nội",
        "total_ordered": 500,
        "pending_qty": 120,
        "delivered_qty": 380,
        "last_order_date": "2026-06-07"
      },
      {
        "branch_id": 2,
        "branch_name": "Chi nhánh TP.HCM",
        "region": "Nam",
        "province": "TP. Hồ Chí Minh",
        "total_ordered": 300,
        "pending_qty": 50,
        "delivered_qty": 250,
        "last_order_date": "2026-06-05"
      }
    ],
    "total_ordered_all_branches": 800
  }
}
```

**Controller**:

```php
public function branchStats(int $productId): JsonResponse
{
    $stats = DB::table('order_details')
        ->join('orders', 'order_details.order_id', '=', 'orders.id')
        ->join('branches', 'orders.branch_id', '=', 'branches.id')
        ->where('order_details.product_id', $productId)
        ->whereNotNull('orders.branch_id')
        ->where('orders.deleted_flag', 0)
        ->selectRaw('
            branches.id as branch_id,
            branches.branch_name,
            branches.region,
            branches.province,
            SUM(order_details.quantity) as total_ordered,
            SUM(CASE WHEN orders.status IN ("PENDING","CONFIRMED","PROCESSING") 
                THEN order_details.quantity ELSE 0 END) as pending_qty,
            SUM(CASE WHEN orders.status = "DELIVERED" 
                THEN order_details.quantity ELSE 0 END) as delivered_qty,
            MAX(orders.created) as last_order_date
        ')
        ->groupBy('branches.id', 'branches.branch_name', 'branches.region', 'branches.province')
        ->orderByDesc('total_ordered')
        ->get();

    return response()->json([
        'success' => true,
        'data'    => [
            'product_id'                => $productId,
            'branches'                  => $stats,
            'total_ordered_all_branches'=> $stats->sum('total_ordered'),
        ],
    ]);
}
```

---

## 7. Branch User tạo Staff trong chi nhánh mình

```php
// BranchUserManagementController::store
// Middleware: auth:sanctum + role:admin,branch_manager

public function store(Request $request, int $branchId): JsonResponse
{
    $authUser = auth()->user();

    // Branch manager chỉ tạo được trong chi nhánh của mình
    if ($authUser->user_type === 'branch_manager' && $authUser->branch_id !== $branchId) {
        return response()->json(['success' => false, 'message' => 'M0403_FORBIDDEN'], 403);
    }

    // Branch manager chỉ tạo được staff, không tạo được manager
    $maxRole = $authUser->user_type === 'admin' ? 'manager' : 'staff';

    $data = $request->validate([
        'login_id'  => 'required|string|max:100|unique:branch_users,login_id',
        'password'  => 'required|string|min:8',
        'full_name' => 'required|string|max:150',
        'email'     => 'nullable|email',
        'role'      => 'required|in:' . ($authUser->user_type === 'admin' ? 'manager,staff' : 'staff'),
    ]);

    $branchUser = BranchUser::create([
        'branch_id'       => $branchId,
        'login_id'        => $data['login_id'],
        'password'        => Hash::make($data['password']),
        'full_name'       => $data['full_name'],
        'email'           => $data['email'] ?? null,
        'role'            => $data['role'],
        'created'         => now(),
        'created_user_id' => $authUser->id,
    ]);

    return response()->json([
        'success' => true,
        'data'    => ['id' => $branchUser->id, 'login_id' => $branchUser->login_id, 'role' => $branchUser->role],
        'message' => 'M0000',
    ], 201);
}
```

---

## 8. Routes mới — thêm vào `routes/api.php`

```php
// ── Chi nhánh (Admin quản lý) ────────────────────────
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/branches',             [BranchController::class, 'index']);
    Route::post('/branches',            [BranchController::class, 'store']);
    Route::get('/branches/{id}',        [BranchController::class, 'show']);
    Route::put('/branches/{id}',        [BranchController::class, 'update']);
    Route::put('/branches/{id}/toggle', [BranchController::class, 'toggle']);

    // Admin thấy stats SP theo chi nhánh
    Route::get('/products/{id}/branch-stats', [ProductController::class, 'branchStats']);
});

// ── Branch user management (Admin + Manager) ─────────
Route::middleware(['auth:sanctum', 'role:admin,branch_manager'])->group(function () {
    Route::get('/branches/{id}/users',              [BranchUserManagementController::class, 'index']);
    Route::post('/branches/{id}/users',             [BranchUserManagementController::class, 'store']);
    Route::put('/branches/{id}/users/{userId}',     [BranchUserManagementController::class, 'update']);
    Route::put('/branches/{id}/users/{userId}/toggle', [BranchUserManagementController::class, 'toggle']);
});

// ── Branch user actions ───────────────────────────────
// Orders: branch user có thể tạo đơn (dùng chung route POST /orders với company)
// Đã xử lý trong OrderController::store bằng cách check user_type

// Branch user xem chi nhánh của mình
Route::middleware(['auth:sanctum', 'role:branch'])->group(function () {
    Route::get('/my-branch', [BranchController::class, 'myBranch']); // thông tin chi nhánh hiện tại
});
```

---

## 9. Filter Orders theo role

```php
// OrderController::index — cập nhật filter

$user = auth()->user();

$query = Order::query()->with(['details', 'branch', 'company']);

if ($user->user_type === 'admin') {
    // Admin thấy tất cả
} elseif ($user->user_type === 'company') {
    $query->where('company_vn_id', $user->id);
} elseif (str_starts_with($user->user_type, 'branch_')) {
    // Cả manager lẫn staff đều chỉ thấy đơn của chi nhánh mình
    $query->where('branch_id', $user->branch_id);
}
```

---

## 10. GET /auth/me — trả thêm branch info

```json
{
  "success": true,
  "data": {
    "id": 5,
    "login_id": "hanoi_manager",
    "full_name": "Nguyễn Văn A",
    "user_type": "branch_manager",
    "role": "manager",
    "branch": {
      "id": 1,
      "branch_cd": "CN-HN-01",
      "branch_name": "Chi nhánh Hà Nội",
      "region": "Bắc",
      "province": "Hà Nội"
    }
  }
}
```

---

## 11. Message Codes mới

| Code | Ý nghĩa |
|------|---------|
| M1200 | Tạo chi nhánh thành công |
| M1201 | Chi nhánh không tìm thấy |
| M1202 | Tạo user chi nhánh thành công |
| M1203 | Branch Manager không thể tạo Manager khác |
| M1204 | Chỉ quản lý được chi nhánh của mình |

---

## 12. Checklist dev

### Backend
```
[ ] Migration branches
[ ] Migration branch_users
[ ] Migration orders: thêm branch_id
[ ] Model Branch, BranchUser (HasApiTokens + getUserTypeAttribute)
[ ] config/auth.php: thêm provider branch_users
[ ] AuthService: thêm check branch_users (thứ 3, sau admin và company)
[ ] RoleMiddleware: thêm wildcard 'branch'
[ ] BranchController (Admin CRUD)
[ ] BranchUserManagementController (Admin + Manager tạo user)
[ ] ProductController::branchStats (Admin xem SP theo chi nhánh)
[ ] OrderController::store: tự set branch_id nếu user là branch
[ ] OrderController::index: filter theo branch_id
[ ] Verify tinker: tạo branch → tạo branch_user → login → user_type đúng
```

### Frontend
```
[ ] Thêm menu "Chi nhánh" vào Admin sidebar
[ ] Trang /admin/branches: list + tạo + sửa chi nhánh
[ ] Trang /admin/branches/{id}/users: quản lý user chi nhánh
[ ] Trang /my-branch: Branch user thấy thông tin chi nhánh mình
[ ] Sidebar branch_manager: ẩn menu Quản trị toàn hệ thống, hiện "Nhân viên chi nhánh"
[ ] Trang product detail (Admin): thêm tab "Theo chi nhánh" hiển thị branchStats
[ ] Filter đơn hàng: branch user tự động lọc theo chi nhánh
```

### Test Tinker
```bash
php artisan tinker

# Tạo chi nhánh
$branch = App\Models\Branch::create([
    'branch_cd' => 'CN-HN-01', 'branch_name' => 'Chi nhánh Hà Nội',
    'region' => 'Bắc', 'province' => 'Hà Nội',
    'created' => now(), 'created_user_id' => 1,
]);

# Tạo manager
App\Models\BranchUser::create([
    'branch_id' => $branch->id,
    'login_id' => 'hn_manager', 'password' => bcrypt('Manager@123'),
    'full_name' => 'HN Manager', 'role' => 'manager',
    'created' => now(), 'created_user_id' => 1,
]);

# Verify
$u = App\Models\BranchUser::where('login_id', 'hn_manager')->first();
echo $u->user_type;   // → "branch_manager"
echo $u->branch_id;   // → 1
echo Hash::check('Manager@123', $u->password); // → true
```
