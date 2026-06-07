<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->integer("company_vn_id")->nullable(false);
            $table->string("order_no", 50)->nullable(false);
            $table->boolean("order_status")->nullable()->default(false);
            $table->date("order_date")->nullable();
            $table->date("expected_date")->nullable();
            $table->string("total_jpy", 255)->nullable();
            $table->string("total_vnd", 255)->nullable();
            $table->decimal("exchange_rate", 10, 2)->nullable();
            $table->string("shipping_fee", 255)->nullable();
            $table->string("import_tax", 255)->nullable();
            $table->text("biko")->nullable();
            $table->integer("handler_admin_id")->nullable();
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
            $table->foreign('company_vn_id', 'fk_orders_company')->references('id')->on('companies_vn');
            $table->foreign('handler_admin_id', 'fk_orders_admin')->references('id')->on('admins');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
