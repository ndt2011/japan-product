<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->integer("product_id")->nullable(false);
            $table->integer("warehouse_id")->nullable(false);
            $table->integer("quantity")->nullable()->default(0);
            $table->integer("reserved_qty")->nullable()->default(0);
            $table->integer("actual_qty")->nullable()->default(0);
            $table->date("last_check_date")->nullable();
            $table->text("memo")->nullable();
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
            $table->foreign('product_id', 'fk_inv_product')->references('id')->on('products');
            $table->foreign('warehouse_id', 'fk_inv_warehouse')->references('id')->on('warehouses');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
