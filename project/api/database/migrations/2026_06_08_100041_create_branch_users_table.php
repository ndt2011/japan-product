<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('branch_id');
            $table->string('login_id', 100)->unique();
            $table->string('password', 255);
            $table->string('full_name', 150);
            $table->string('email', 255)->nullable();
            $table->string('role', 20);
            $table->tinyInteger('disabled_flag')->default(0);
            $table->datetime('created');
            $table->unsignedInteger('created_user_id');
            $table->datetime('modified')->nullable();
            $table->unsignedInteger('modified_user_id')->nullable();
            $table->datetime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);

            $table->foreign('branch_id')->references('id')->on('branches');
            $table->index(['branch_id', 'deleted_flag']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_users');
    }
};
