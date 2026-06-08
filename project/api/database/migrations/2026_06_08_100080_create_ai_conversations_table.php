<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI Chat nhân viên — phiên hội thoại
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 4
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id')->index();
            $table->string('user_type', 50);  // admin / company / branch_manager / branch_staff
            $table->unsignedBigInteger('user_id');
            $table->string('title', 255)->nullable();  // Auto từ tin nhắn đầu
            $table->datetime('created');
            $table->datetime('modified');

            $table->index(['user_type', 'user_id']);
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant', 'tool']);
            $table->text('content');
            $table->string('intent', 50)->nullable();      // detected intent
            $table->json('tool_calls')->nullable();
            $table->json('tool_results')->nullable();
            $table->unsignedInteger('tokens_used')->nullable();
            $table->datetime('created');

            $table->index('conversation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
    }
};
