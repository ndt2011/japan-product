<?php

use App\Http\Controllers\API\AiChatController;
use App\Http\Controllers\API\AiProductCandidateController;
use App\Http\Controllers\API\AiProductSearchController;
use App\Http\Controllers\API\AiSearchController;
use App\Http\Controllers\API\AdminUserController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BranchController;
use App\Http\Controllers\API\CompanyUserController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\BranchUserManagementController;
use App\Http\Controllers\API\HealthController;
use App\Http\Controllers\API\InvoiceController;
use App\Http\Controllers\API\InventoryController;
use App\Http\Controllers\API\MasterDataController;
use App\Http\Controllers\API\OrderCostController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\ProductImageController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\ShipmentBatchController;
use App\Http\Controllers\API\StockMovementController;
use App\Http\Controllers\API\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/charts/orders', [DashboardController::class, 'orderChart']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin-users', [AdminUserController::class, 'index']);
        Route::post('/admin-users', [AdminUserController::class, 'store']);
        Route::put('/admin-users/{id}/toggle', [AdminUserController::class, 'toggle']);

        Route::get('/company-users', [CompanyUserController::class, 'index']);
        Route::post('/company-users', [CompanyUserController::class, 'store']);
        Route::put('/company-users/{id}/toggle', [CompanyUserController::class, 'toggle']);

        Route::get('/branches', [BranchController::class, 'index']);
        Route::post('/branches', [BranchController::class, 'store']);
        Route::get('/branches/{id}', [BranchController::class, 'show']);
        Route::put('/branches/{id}', [BranchController::class, 'update']);
        Route::put('/branches/{id}/toggle', [BranchController::class, 'toggle']);
        Route::get('/products/{id}/branch-stats', [ProductController::class, 'branchStats']);

        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);

        Route::post('/products/{product}/images', [ProductImageController::class, 'store']);
        Route::put('/products/{product}/images/reorder', [ProductImageController::class, 'reorder']);
        Route::put('/products/{product}/images/{image}/set-primary', [ProductImageController::class, 'setPrimary']);
        Route::put('/products/{product}/images/{image}', [ProductImageController::class, 'update']);
        Route::delete('/products/{product}/images/{image}', [ProductImageController::class, 'destroy']);

        Route::put('/ai/candidates/{id}/approve', [AiProductCandidateController::class, 'approve']);
        Route::put('/ai/candidates/{id}/reject', [AiProductCandidateController::class, 'reject']);

        Route::put('/orders/{id}/confirm', [OrderController::class, 'confirm']);

        Route::get('/orders/{id}/costs', [OrderCostController::class, 'index']);
        Route::post('/orders/{id}/costs', [OrderCostController::class, 'store']);
        Route::delete('/orders/{id}/costs/{costId}', [OrderCostController::class, 'destroy']);

        Route::get('/invoices/debt-summary', [InvoiceController::class, 'debtSummary']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
        Route::post('/invoices/{id}/send', [InvoiceController::class, 'send']);
        Route::post('/invoices/{id}/pay', [InvoiceController::class, 'pay']);

        Route::get('/shipment-batches/available-orders', [ShipmentBatchController::class, 'availableOrders']);
        Route::post('/shipment-batches', [ShipmentBatchController::class, 'store']);
        Route::put('/shipment-batches/{id}', [ShipmentBatchController::class, 'update']);
        Route::put('/shipment-batches/{id}/status', [ShipmentBatchController::class, 'advanceStatus']);
    });

    Route::get('/products/{product}/images', [ProductImageController::class, 'index']);

    Route::get('/suppliers', [MasterDataController::class, 'suppliers']);
    Route::get('/product-categories', [MasterDataController::class, 'categories']);
    Route::get('/exchange-rates/current', [MasterDataController::class, 'currentExchangeRate']);

    // AI Chat nhân viên — spec: docs/sa/amendments/ai-conversation-upgrade.md
    Route::post('/ai/chat', [AiChatController::class, 'chat']);
    Route::get('/ai/conversations', [AiChatController::class, 'conversations']);
    Route::get('/ai/conversations/{id}/messages', [AiChatController::class, 'messages']);

    Route::post('/ai/product-search', [AiProductSearchController::class, 'search']);
    Route::post('/ai/search', [AiSearchController::class, 'store']);
    Route::get('/ai/search/{id}', [AiSearchController::class, 'show']);

    Route::get('/ai/candidates', [AiProductCandidateController::class, 'index']);
    Route::post('/ai/candidates', [AiProductCandidateController::class, 'store']);
    Route::get('/ai/candidates/{id}', [AiProductCandidateController::class, 'show']);

    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show'])->whereNumber('id');
    Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'pdf'])->whereNumber('id');

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::put('/orders/{id}/submit', [OrderController::class, 'submit']);
    Route::put('/orders/{id}/confirm-receipt', [OrderController::class, 'confirmReceipt']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    Route::get('/shipment-batches', [ShipmentBatchController::class, 'index']);
    Route::get('/shipment-batches/{id}', [ShipmentBatchController::class, 'show']);

    Route::get('/reports/orders', [ReportController::class, 'orders']);

    Route::middleware('role:admin,branch_manager')->group(function () {
        Route::get('/branches/{id}/users', [BranchUserManagementController::class, 'index']);
        Route::post('/branches/{id}/users', [BranchUserManagementController::class, 'store']);
        Route::put('/branches/{id}/users/{userId}', [BranchUserManagementController::class, 'update']);
        Route::put('/branches/{id}/users/{userId}/toggle', [BranchUserManagementController::class, 'toggle']);
    });

    Route::middleware('role:branch')->group(function () {
        Route::get('/my-branch', [BranchController::class, 'myBranch']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/warehouses', [WarehouseController::class, 'index']);
        Route::post('/warehouses', [WarehouseController::class, 'store']);
        Route::get('/warehouses/{id}', [WarehouseController::class, 'show']);

        Route::get('/inventories', [InventoryController::class, 'index']);
        Route::post('/inventory-checks', [InventoryController::class, 'check']);

        Route::get('/stock-movements', [StockMovementController::class, 'index']);
        Route::post('/stock-movements', [StockMovementController::class, 'store']);

        Route::get('/reports/inventory', [ReportController::class, 'inventory']);
        Route::get('/reports/stock-movements', [ReportController::class, 'stockMovements']);
        Route::get('/reports/revenue', [ReportController::class, 'revenue']);
        Route::get('/reports/profit', [ReportController::class, 'profit']);
    });
});
