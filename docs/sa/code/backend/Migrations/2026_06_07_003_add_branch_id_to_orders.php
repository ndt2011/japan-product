<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Thêm sau cột company_vn_id (hoặc cuối bảng — tuỳ schema hiện tại)
            $table->unsignedBigInteger('branch_id')
                ->nullable()
                ->after('company_vn_id')
                ->comment('Null = đơn của công ty VN trực tiếp, có giá trị = đặt qua chi nhánh');

            $table->foreign('branch_id')->references('id')->on('branches');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }
};
