<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Upgrade V3 — Giai đoạn 1 (Critical)
 * spec: docs/sa/amendments/upgrade-v3-analysis.md
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->string('user_type', 30);
                $table->unsignedBigInteger('user_id');
                $table->string('type', 50);
                $table->string('title', 200);
                $table->text('body')->nullable();
                $table->string('data_type', 50)->nullable();
                $table->unsignedBigInteger('data_id')->nullable();
                $table->boolean('is_read')->default(false);
                $table->dateTime('created');
                $table->index(['user_type', 'user_id', 'is_read']);
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (! Schema::hasColumn('products', 'retail_price_vnd')) {
                    $table->unsignedInteger('retail_price_vnd')->nullable()->after('price_vnd');
                }
                if (! Schema::hasColumn('products', 'barcode')) {
                    $table->string('barcode', 50)->nullable()->after('product_cd');
                }
                if (! Schema::hasColumn('products', 'min_order_qty')) {
                    $table->unsignedInteger('min_order_qty')->nullable()->after('unit');
                }
            });
        }

        if (Schema::hasTable('warehouses')) {
            Schema::table('warehouses', function (Blueprint $table) {
                if (! Schema::hasColumn('warehouses', 'location_type')) {
                    $table->string('location_type', 2)->default('VN')->after('country');
                }
                if (! Schema::hasColumn('warehouses', 'is_default')) {
                    $table->boolean('is_default')->default(false)->after('location_type');
                }
            });
        }

        if (Schema::hasTable('inventories')) {
            Schema::table('inventories', function (Blueprint $table) {
                if (! Schema::hasColumn('inventories', 'inventory_cd')) {
                    $table->string('inventory_cd', 40)->nullable()->unique()->after('id');
                }
                if (! Schema::hasColumn('inventories', 'restock_status')) {
                    $table->string('restock_status', 20)->default('NORMAL')->after('memo');
                }
                if (! Schema::hasColumn('inventories', 'restock_eta')) {
                    $table->date('restock_eta')->nullable()->after('restock_status');
                }
                if (! Schema::hasColumn('inventories', 'min_stock_qty')) {
                    $table->unsignedInteger('min_stock_qty')->default(5)->after('restock_eta');
                }
                if (! Schema::hasColumn('inventories', 'last_restock_at')) {
                    $table->dateTime('last_restock_at')->nullable()->after('min_stock_qty');
                }
                if (! Schema::hasColumn('inventories', 'notes')) {
                    $table->text('notes')->nullable()->after('last_restock_at');
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (! Schema::hasColumn('orders', 'payment_method')) {
                    $table->string('payment_method', 30)->nullable()->after('biko');
                }
                if (! Schema::hasColumn('orders', 'payment_at')) {
                    $table->dateTime('payment_at')->nullable()->after('payment_method');
                }
                if (! Schema::hasColumn('orders', 'payment_ref')) {
                    $table->string('payment_ref', 100)->nullable()->after('payment_at');
                }
                if (! Schema::hasColumn('orders', 'payment_note')) {
                    $table->text('payment_note')->nullable()->after('payment_ref');
                }
                if (! Schema::hasColumn('orders', 'approved_at')) {
                    $table->dateTime('approved_at')->nullable()->after('payment_note');
                }
                if (! Schema::hasColumn('orders', 'approved_by')) {
                    $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
                }
                if (! Schema::hasColumn('orders', 'tracking_no')) {
                    $table->string('tracking_no', 100)->nullable()->after('approved_by');
                }
                if (! Schema::hasColumn('orders', 'carrier_name')) {
                    $table->string('carrier_name', 100)->nullable()->after('tracking_no');
                }
            });
        }

        if (Schema::hasTable('shipment_batches')) {
            Schema::table('shipment_batches', function (Blueprint $table) {
                if (! Schema::hasColumn('shipment_batches', 'carrier_name')) {
                    $table->string('carrier_name', 100)->nullable()->after('logistics_partner');
                }
                if (! Schema::hasColumn('shipment_batches', 'shipping_at')) {
                    $table->dateTime('shipping_at')->nullable()->after('tracking_number');
                }
                if (! Schema::hasColumn('shipment_batches', 'estimated_arrival')) {
                    $table->date('estimated_arrival')->nullable()->after('shipping_at');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');

        foreach (['products' => ['retail_price_vnd', 'barcode', 'min_order_qty'],
            'warehouses' => ['location_type', 'is_default'],
            'inventories' => ['inventory_cd', 'restock_status', 'restock_eta', 'min_stock_qty', 'last_restock_at', 'notes'],
            'orders' => ['payment_method', 'payment_at', 'payment_ref', 'payment_note', 'approved_at', 'approved_by', 'tracking_no', 'carrier_name'],
            'shipment_batches' => ['carrier_name', 'shipping_at', 'estimated_arrival'],
        ] as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns, $table) {
                    foreach ($columns as $col) {
                        if (Schema::hasColumn($table, $col)) {
                            $blueprint->dropColumn($col);
                        }
                    }
                });
            }
        }
    }
};
