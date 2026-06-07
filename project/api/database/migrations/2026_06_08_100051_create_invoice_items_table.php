<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('order_detail_id')->nullable();
            $table->string('product_name', 255);
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price_vnd', 15, 0)->default(0);
            $table->decimal('amount', 15, 0)->default(0);

            $table->foreign('invoice_id', 'fk_invoice_items_invoice')->references('id')->on('invoices')->cascadeOnDelete();
            $table->foreign('order_detail_id', 'fk_invoice_items_order_detail')->references('id')->on('order_details')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
