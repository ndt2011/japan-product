<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_type', 10)->comment('IN|OUT|ADJUST');
            $table->unsignedInteger('product_id');
            $table->unsignedInteger('warehouse_id');
            $table->integer('quantity');
            $table->integer('quantity_before')->default(0);
            $table->integer('quantity_after')->default(0);
            $table->string('ref_type', 30)->nullable()->comment('order|batch|manual|check');
            $table->unsignedBigInteger('ref_id')->nullable();
            $table->string('reason', 500)->nullable();
            $table->text('note')->nullable();
            $table->dateTime('created');
            $table->unsignedInteger('created_user_id');

            $table->foreign('product_id')->references('id')->on('products');
            $table->foreign('warehouse_id')->references('id')->on('warehouses');

            $table->index(['product_id', 'warehouse_id']);
            $table->index(['movement_type', 'created']);
            $table->index(['ref_type', 'ref_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
