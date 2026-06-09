<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchasing_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('user_type', 30);
            $table->unsignedBigInteger('user_id');
            $table->string('query', 500);
            $table->string('keyword_jp', 500)->nullable();
            $table->unsignedInteger('budget_jpy')->nullable();
            $table->unsignedInteger('qty')->nullable()->default(1);
            $table->string('status', 20)->default('completed');
            $table->json('response_json')->nullable();
            $table->dateTime('created')->nullable();

            $table->index(['user_type', 'user_id'], 'idx_purchasing_sessions_user');
            $table->index('created', 'idx_purchasing_sessions_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchasing_sessions');
    }
};
