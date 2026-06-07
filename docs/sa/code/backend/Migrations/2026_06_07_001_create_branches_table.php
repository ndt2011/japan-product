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
            $table->string('branch_cd', 20)->unique()->comment('Mã chi nhánh');
            $table->string('branch_name', 100)->comment('Tên chi nhánh');
            $table->enum('region', ['Bắc', 'Trung', 'Nam'])->comment('Vùng miền');
            $table->string('province', 100)->comment('Tỉnh/Thành phố');
            $table->string('address', 255)->nullable()->comment('Địa chỉ');

            // Audit columns
            $table->dateTime('created')->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();
            $table->dateTime('modified')->nullable();
            $table->unsignedBigInteger('modified_user_id')->nullable();
            $table->dateTime('deleted')->nullable();
            $table->tinyInteger('deleted_flag')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
