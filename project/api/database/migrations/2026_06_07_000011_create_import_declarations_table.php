<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_declarations', function (Blueprint $table) {
            $table->id();
            $table->integer("order_id")->nullable(false);
            $table->string("declaration_no", 50)->nullable();
            $table->date("declaration_date")->nullable();
            $table->boolean("customs_status")->nullable()->default(false);
            $table->string("port_of_entry", 100)->nullable();
            $table->string("declared_value_jpy", 255)->nullable();
            $table->string("total_tax_vnd", 255)->nullable();
            $table->string("declaration_file", 500)->nullable();
            $table->text("memo")->nullable();
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
            $table->foreign('order_id', 'fk_impd_order')->references('id')->on('orders');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_declarations');
    }
};
