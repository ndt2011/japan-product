<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('branch_cd', 50)->unique();
            $table->string('branch_name', 255);
            $table->string('region', 50);
            $table->string('province', 100);
            $table->text('address')->nullable();
            $table->string('tel', 20)->nullable();
            $table->tinyInteger('disabled_flag')->default(0);
            $table->datetime('created');
            $table->unsignedInteger('created_user_id');
            $table->datetime('modified')->nullable();
            $table->unsignedInteger('modified_user_id')->nullable();
            $table->datetime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);
            $table->index(['region', 'province']);
            $table->index('deleted_flag');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
