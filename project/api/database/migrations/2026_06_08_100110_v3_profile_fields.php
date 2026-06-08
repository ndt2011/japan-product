<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['admins', 'companies_vn', 'branch_users'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (! Schema::hasColumn($table, 'avatar_url')) {
                    $blueprint->text('avatar_url')->nullable();
                }
                if (! Schema::hasColumn($table, 'phone')) {
                    $blueprint->string('phone', 20)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['admins', 'companies_vn', 'branch_users'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                foreach (['avatar_url', 'phone'] as $col) {
                    if (Schema::hasColumn($table, $col)) {
                        $blueprint->dropColumn($col);
                    }
                }
            });
        }
    }
};
