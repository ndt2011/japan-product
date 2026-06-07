<?php

use App\Http\Controllers\API\AiProductCandidateController;
use App\Http\Controllers\API\AiProductSearchController;
use App\Http\Controllers\API\AiSearchController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\HealthController;
use App\Http\Controllers\API\MasterDataController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ShipmentBatchController;
use App\Http\Controllers\API\ProductImageController;
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
    Route::apiResource('products', ProductController::class);

    Route::get('/products/{product}/images', [ProductImageController::class, 'index']);
    Route::post('/products/{product}/images', [ProductImageController::class, 'store']);
    Route::put('/products/{product}/images/{image}', [ProductImageController::class, 'update']);
    Route::delete('/products/{product}/images/{image}', [ProductImageController::class, 'destroy']);

    Route::get('/suppliers', [MasterDataController::class, 'suppliers']);
    Route::get('/product-categories', [MasterDataController::class, 'categories']);
    Route::get('/exchange-rates/current', [MasterDataController::class, 'currentExchangeRate']);

    Route::post('/ai/product-search', [AiProductSearchController::class, 'search']);

    Route::post('/ai/search', [AiSearchController::class, 'store']);
    Route::get('/ai/search/{id}', [AiSearchController::class, 'show']);

    Route::get('/ai/candidates', [AiProductCandidateController::class, 'index']);
    Route::post('/ai/candidates', [AiProductCandidateController::class, 'store']);
    Route::get('/ai/candidates/{id}', [AiProductCandidateController::class, 'show']);
    Route::put('/ai/candidates/{id}/approve', [AiProductCandidateController::class, 'approve']);
    Route::put('/ai/candidates/{id}/reject', [AiProductCandidateController::class, 'reject']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::put('/orders/{id}/submit', [OrderController::class, 'submit']);
    Route::put('/orders/{id}/confirm', [OrderController::class, 'confirm']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    Route::get('/shipment-batches/available-orders', [ShipmentBatchController::class, 'availableOrders']);
    Route::get('/shipment-batches', [ShipmentBatchController::class, 'index']);
    Route::post('/shipment-batches', [ShipmentBatchController::class, 'store']);
    Route::get('/shipment-batches/{id}', [ShipmentBatchController::class, 'show']);
    Route::put('/shipment-batches/{id}', [ShipmentBatchController::class, 'update']);
    Route::put('/shipment-batches/{id}/status', [ShipmentBatchController::class, 'advanceStatus']);
});
