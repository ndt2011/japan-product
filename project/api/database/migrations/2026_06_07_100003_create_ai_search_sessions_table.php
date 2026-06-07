<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_search_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('keyword', 500);
            $table->string('status', 20)->default('processing');
            $table->string('user_type', 20);
            $table->unsignedBigInteger('user_id');
            $table->json('results_json')->nullable();
            $table->text('error_message')->nullable();
            $table->dateTime('created')->nullable();
            $table->dateTime('completed_at')->nullable();

            $table->index(['user_type', 'user_id'], 'idx_ai_sessions_user');
            $table->index('status', 'idx_ai_sessions_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_search_sessions');
    }
};
