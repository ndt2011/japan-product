<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies_vn', function (Blueprint $table) {
            $table->id();
            $table->string("company_cd", 50)->nullable();
            $table->string("company_name", 255)->nullable(false);
            $table->string("address", 500)->nullable();
            $table->string("province", 100)->nullable();
            $table->string("tel", 20)->nullable();
            $table->string("fax", 20)->nullable();
            $table->string("email", 255)->nullable();
            $table->string("tax_code", 20)->nullable();
            $table->string("contact_name", 100)->nullable();
            $table->text("memo")->nullable();
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
        Schema::dropIfExists('companies_vn');
    }
};
