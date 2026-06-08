<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Thêm cột keyword_jp vào ai_search_sessions.
 * Lưu keyword đã dịch sang tiếng Nhật để gửi lên Rakuten API.
 * Giúp debug khi kết quả tìm kiếm bị sai/thiếu.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_search_sessions', function (Blueprint $table) {
            $table->string('keyword_jp', 500)
                ->nullable()
                ->after('keyword')
                ->comment('Keyword đã dịch sang tiếng Nhật, gửi lên Rakuten API');
        });
    }

    public function down(): void
    {
        Schema::table('ai_search_sessions', function (Blueprint $table) {
            $table->dropColumn('keyword_jp');
        });
    }
};
