<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string("from_currency", 10)->nullable(false)->default('JPY');
            $table->string("to_currency", 10)->nullable(false)->default('VND');
            $table->decimal("rate", 15, 4)->nullable(false);
            $table->date("apply_date")->nullable(false);
            $table->string("source", 100)->nullable();
            $table->string("memo", 255)->nullable();
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
        Schema::dropIfExists('exchange_rates');
    }
};
