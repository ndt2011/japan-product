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
            $table->foreignId('branch_id')->constrained('branches');
            $table->string('login_id', 50)->unique()->comment('Username đăng nhập');
            $table->string('password', 255);
            $table->string('full_name', 100);
            $table->enum('role', ['manager', 'staff'])->default('staff');

            // Audit columns
            $table->dateTime('created')->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->dateTime('modified')->nullable();
            $table->unsignedBigInteger('modified_user_id')->nullable();
            $table->dateTime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_users');
    }
};
