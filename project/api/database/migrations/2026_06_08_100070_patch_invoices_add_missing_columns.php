<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Patch: Thêm các cột còn thiếu vào invoices (idempotent — an toàn re-deploy Railway)
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('invoices')) {
            return;
        }

        $add = static function (string $column, callable $callback): void {
            if (! Schema::hasColumn('invoices', $column)) {
                Schema::table('invoices', $callback);
            }
        };

        $add('locked_rate', function (Blueprint $table) {
            $table->decimal('locked_rate', 10, 4)->nullable()->after('due_date');
        });
        $add('fee_rate', function (Blueprint $table) {
            $table->decimal('fee_rate', 5, 4)->default(0.0500)->after('locked_rate');
        });
        $add('subtotal_vnd', function (Blueprint $table) {
            $table->decimal('subtotal_vnd', 15, 0)->default(0)->after('fee_rate');
        });
        $add('fee_amount_vnd', function (Blueprint $table) {
            $table->decimal('fee_amount_vnd', 15, 0)->default(0)->after('subtotal_vnd');
        });
        $add('sent_at', function (Blueprint $table) {
            $table->dateTime('sent_at')->nullable()->after('status');
        });
        $add('pdf_path', function (Blueprint $table) {
            $table->string('pdf_path', 500)->nullable()->after('note');
        });
        $add('payment_note', function (Blueprint $table) {
            $table->text('payment_note')->nullable()->after('pdf_path');
        });
        $add('branch_id', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('company_vn_id');
        });

        // company_vn_id nullable — cần doctrine/dbal trên MySQL
        if (Schema::hasColumn('invoices', 'company_vn_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->unsignedBigInteger('company_vn_id')->nullable()->change();
            });
        }

        if (Schema::hasColumn('invoices', 'subtotal_vnd') && Schema::hasColumn('invoices', 'amount_vnd')) {
            DB::statement('UPDATE invoices SET subtotal_vnd = amount_vnd WHERE subtotal_vnd = 0 AND amount_vnd > 0');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('invoices')) {
            return;
        }

        $cols = ['locked_rate', 'fee_rate', 'subtotal_vnd', 'fee_amount_vnd', 'sent_at', 'pdf_path', 'payment_note', 'branch_id'];
        $existing = array_filter($cols, fn ($c) => Schema::hasColumn('invoices', $c));

        if ($existing !== []) {
            Schema::table('invoices', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }
    }
};
