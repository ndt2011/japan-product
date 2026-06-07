<?php

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SNIPPET: Thêm vào routes/api.php
 * Copy từng block vào đúng vị trí trong file api.php hiện tại.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Đăng ký middleware trong app/Http/Kernel.php:
 *
 *   protected $routeMiddleware = [
 *       // ... existing ...
 *       'role' => \App\Http\Middleware\RoleMiddleware::class,
 *   ];
 *
 * Đăng ký tokenable models trong config/sanctum.php:
 *
 *   'guard' => ['web'],
 *   // Thêm vào AppServiceProvider::boot():
 *   Sanctum::usePersonalAccessTokenModel(\Laravel\Sanctum\PersonalAccessToken::class);
 *
 * Và trong config/auth.php thêm guards:
 *
 *   'guards' => [
 *       'sanctum' => ['driver' => 'sanctum'],
 *   ],
 */

use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchUserController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════════════════════════════════
// AUTH — không cần token
// ═══════════════════════════════════════════════════════════════════════════
Route::post('/auth/login',  [App\Http\Controllers\AuthController::class, 'login']);

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATED — cần Sanctum token
// ═══════════════════════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('/auth/me',      [App\Http\Controllers\AuthController::class, 'me']);

    // ── ADMIN only ───────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {

        // Warehouse
        Route::apiResource('warehouses', WarehouseController::class)
            ->only(['index', 'store', 'show']);

        // Inventory
        Route::get('inventories',              [InventoryController::class, 'index']);
        Route::get('stock-movements',          [InventoryController::class, 'movements']);
        Route::post('stock-movements/stock-in',  [InventoryController::class, 'stockIn']);
        Route::post('stock-movements/stock-out', [InventoryController::class, 'stockOut']);
        Route::post('stock-movements/adjust',    [InventoryController::class, 'adjust']);

        // Branch management (admin)
        Route::apiResource('branches', BranchController::class);
    });

    // ── ADMIN + BRANCH_MANAGER — quản lý branch users ───────────────────
    Route::middleware('role:admin,branch_manager')->group(function () {
        Route::apiResource('branch-users', BranchUserController::class);
    });

    // ── ADMIN + COMPANY_VN ───────────────────────────────────────────────
    Route::middleware('role:admin,company_vn')->group(function () {
        Route::apiResource('products', App\Http\Controllers\ProductController::class);
        Route::apiResource('orders',   App\Http\Controllers\OrderController::class);
    });

    // ── ANY BRANCH USER — xem đơn hàng chi nhánh mình ──────────────────
    Route::middleware('role:branch')->group(function () {
        Route::get('branch/orders',       [App\Http\Controllers\OrderController::class, 'branchOrders']);
        Route::get('branch/inventories',  [InventoryController::class, 'index']);
    });

    // ── ALL AUTHENTICATED ────────────────────────────────────────────────
    Route::get('exchange-rates/current', [App\Http\Controllers\ExchangeRateController::class, 'current']);
    Route::get('product-categories',     [App\Http\Controllers\ProductCategoryController::class, 'index']);
});
