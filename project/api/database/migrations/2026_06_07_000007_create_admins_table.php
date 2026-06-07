<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string("login_id", 50)->nullable(false);
            $table->string("password", 255)->nullable(false);
            $table->string("full_name", 100)->nullable(false);
            $table->string("email", 255)->nullable(false);
            $table->integer("branch_id")->nullable();
            $table->boolean("disabled_flag")->nullable()->default(false);
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
            $table->unique('login_id', 'idx_login_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
