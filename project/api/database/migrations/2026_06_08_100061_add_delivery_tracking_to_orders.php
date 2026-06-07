<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dateTime('delivered_admin_at')->nullable()->after('handler_admin_id');
            $table->dateTime('delivered_client_at')->nullable()->after('delivered_admin_at');
            $table->dateTime('completed_at')->nullable()->after('delivered_client_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivered_admin_at', 'delivered_client_at', 'completed_at']);
        });
    }
};
