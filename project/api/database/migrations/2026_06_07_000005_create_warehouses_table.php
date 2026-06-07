<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string("warehouse_cd", 50)->nullable();
            $table->string("warehouse_name", 255)->nullable(false);
            $table->string("address", 500)->nullable();
            $table->string("country", 10)->nullable()->default('VN');
            $table->string("manager_name", 100)->nullable();
            $table->string("tel", 20)->nullable();
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
        Schema::dropIfExists('warehouses');
    }
};
