<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger("order_id")->nullable(false);
            $table->unsignedBigInteger("product_id")->nullable(false);
            $table->integer("quantity")->nullable();
            $table->integer("unit_price_jpy")->nullable();
            $table->string("unit_price_vnd", 255)->nullable();
            $table->string("subtotal_vnd", 255)->nullable();
            $table->decimal("import_tax_rate", 5, 2)->nullable();
            $table->string("import_tax_amt", 255)->nullable();
            $table->text("comment")->nullable();
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
            $table->foreign('order_id', 'fk_od_order')->references('id')->on('orders');
            $table->foreign('product_id', 'fk_od_product')->references('id')->on('products');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_details');
    }
};
