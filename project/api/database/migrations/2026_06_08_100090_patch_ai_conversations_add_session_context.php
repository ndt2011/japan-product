<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bộ nhớ phiên AI — sở thích khách trong 1 conversation.
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 11
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ai_conversations')) {
            return;
        }

        Schema::table('ai_conversations', function (Blueprint $table) {
            if (! Schema::hasColumn('ai_conversations', 'session_context')) {
                $table->json('session_context')->nullable()->after('title');
            }
            if (! Schema::hasColumn('ai_conversations', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('user_id');
                $table->index('branch_id');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('ai_conversations')) {
            return;
        }

        Schema::table('ai_conversations', function (Blueprint $table) {
            if (Schema::hasColumn('ai_conversations', 'session_context')) {
                $table->dropColumn('session_context');
            }
            if (Schema::hasColumn('ai_conversations', 'branch_id')) {
                $table->dropIndex(['branch_id']);
                $table->dropColumn('branch_id');
            }
        });
    }
};
