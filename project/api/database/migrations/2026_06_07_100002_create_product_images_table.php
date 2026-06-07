<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('image_path', 500);
            $table->boolean('is_primary')->default(false);
            $table->integer('order_no')->default(0);
            $table->dateTime('created')->nullable();
            $table->boolean('deleted_flag')->default(false);

            $table->foreign('product_id', 'fk_product_images_product')
                ->references('id')
                ->on('products');
            $table->index(['product_id', 'deleted_flag'], 'idx_product_images_product');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
