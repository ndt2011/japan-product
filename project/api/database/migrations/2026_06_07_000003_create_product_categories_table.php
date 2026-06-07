<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string("category_name", 255)->nullable(false);
            $table->integer("order_no")->nullable();
            $table->boolean("disabled_flag")->nullable()->default(false);
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
