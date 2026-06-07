<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\HealthController;
use App\Http\Controllers\API\MasterDataController;
use App\Http\Controllers\API\ProductController;
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

    Route::get('/suppliers', [MasterDataController::class, 'suppliers']);
    Route::get('/product-categories', [MasterDataController::class, 'categories']);
    Route::get('/exchange-rates/current', [MasterDataController::class, 'currentExchangeRate']);
});
