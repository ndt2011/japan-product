<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tạo bảng order_costs — Admin nhập chi phí thực tế để tính net_profit
 * spec: docs/sa/amendments/invoice-payment.md § 3.5
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('order_costs')) {
            return;
        }

        Schema::create('order_costs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('batch_id')->nullable()
                ->comment('Nếu chi phí gắn với chuyến hàng');
            $table->string('cost_type', 50)->default('other')
                ->comment('shipping | customs_jp | customs_vn | handling | other');
            $table->decimal('amount_vnd', 15, 0)->default(0);
            $table->string('note', 500)->nullable();
            $table->dateTime('created')->nullable();
            $table->unsignedInteger('created_user_id')->nullable();

            $table->foreign('order_id', 'fk_order_costs_order')->references('id')->on('orders')->cascadeOnDelete();
            $table->index('order_id');
            $table->index('cost_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_costs');
    }
};
