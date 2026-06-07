<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->integer("product_category_id")->nullable(false);
            $table->string("product_cd", 50)->nullable();
            $table->string("product_name", 255)->nullable(false);
            $table->string("product_name_jp", 255)->nullable();
            $table->string("spec", 255)->nullable();
            $table->string("unit", 20)->nullable();
            $table->integer("cost_jpy")->nullable();
            $table->string("price_vnd", 255)->nullable();
            $table->integer("supplier_id")->nullable();
            $table->string("origin", 100)->nullable();
            $table->decimal("import_tax_rate", 5, 2)->nullable();
            $table->text("description")->nullable();
            $table->string("image_path", 500)->nullable();
            $table->integer("order_no")->nullable();
            $table->boolean("require_flag")->nullable()->default(false);
            $table->integer("min_quantity")->nullable();
            $table->integer("max_quantity")->nullable();
            $table->text("memo")->nullable();
            $table->boolean("disabled_flag")->nullable()->default(false);
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
            $table->foreign('product_category_id', 'fk_products_category')->references('id')->on('product_categories');
            $table->foreign('supplier_id', 'fk_products_supplier')->references('id')->on('suppliers_jp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
