<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies_vn', function (Blueprint $table) {
            $table->string('login_id', 50)->nullable()->after('company_cd');
            $table->string('password', 255)->nullable()->after('login_id');
            $table->unique('login_id', 'idx_companies_vn_login_id');
        });
    }

    public function down(): void
    {
        Schema::table('companies_vn', function (Blueprint $table) {
            $table->dropUnique('idx_companies_vn_login_id');
            $table->dropColumn(['login_id', 'password']);
        });
    }
};
