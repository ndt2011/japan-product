<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Patch: snapshot fields invoice_items (idempotent — an toàn re-deploy Railway)
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('invoice_items')) {
            return;
        }

        if (Schema::hasColumn('invoice_items', 'product_name')
            && ! Schema::hasColumn('invoice_items', 'product_name_jp')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->renameColumn('product_name', 'product_name_jp');
            });
        }

        $add = static function (string $column, callable $callback): void {
            if (! Schema::hasColumn('invoice_items', $column)) {
                Schema::table('invoice_items', $callback);
            }
        };

        $add('product_name_vi', function (Blueprint $table) {
            $table->string('product_name_vi', 255)->nullable()->after('product_name_jp');
        });
        $add('product_sku', function (Blueprint $table) {
            $table->string('product_sku', 100)->nullable()->after('product_name_vi');
        });
        $add('cost_price_jpy', function (Blueprint $table) {
            $table->decimal('cost_price_jpy', 12, 2)->nullable()->after('quantity');
        });
        $add('selling_price_jpy', function (Blueprint $table) {
            $table->decimal('selling_price_jpy', 12, 2)->nullable()->after('cost_price_jpy');
        });
        $add('fee_amount_vnd', function (Blueprint $table) {
            $table->decimal('fee_amount_vnd', 15, 0)->default(0)->after('unit_price_vnd');
        });

        if (Schema::hasColumn('invoice_items', 'amount')
            && ! Schema::hasColumn('invoice_items', 'line_total_vnd')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->renameColumn('amount', 'line_total_vnd');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('invoice_items')) {
            return;
        }

        if (Schema::hasColumn('invoice_items', 'product_name_jp')
            && ! Schema::hasColumn('invoice_items', 'product_name')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->renameColumn('product_name_jp', 'product_name');
            });
        }

        $cols = ['product_name_vi', 'product_sku', 'cost_price_jpy', 'selling_price_jpy', 'fee_amount_vnd'];
        $existing = array_filter($cols, fn ($c) => Schema::hasColumn('invoice_items', $c));

        if ($existing !== []) {
            Schema::table('invoice_items', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }

        if (Schema::hasColumn('invoice_items', 'line_total_vnd')
            && ! Schema::hasColumn('invoice_items', 'amount')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->renameColumn('line_total_vnd', 'amount');
            });
        }
    }
};
