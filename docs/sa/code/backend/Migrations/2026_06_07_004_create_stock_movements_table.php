<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng inventories (tồn kho hiện tại)
        // Nếu chưa có — tạo mới; nếu đã có — bỏ qua block này
        if (!Schema::hasTable('inventories')) {
            Schema::create('inventories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('warehouse_id')->constrained('warehouses');
                $table->unsignedBigInteger('product_id');
                $table->integer('quantity')->default(0);
                $table->dateTime('created')->nullable();
                $table->unsignedBigInteger('created_user_id')->nullable();
                $table->dateTime('modified')->nullable();
                $table->unsignedBigInteger('modified_user_id')->nullable();
                $table->tinyInteger('deleted_flag')->default(0);

                $table->unique(['warehouse_id', 'product_id']);
            });
        }

        // Bảng stock_movements (lịch sử nhập/xuất/kiểm kê)
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->unsignedBigInteger('product_id')->index();
            $table->enum('movement_type', ['IN', 'OUT', 'ADJUST'])
                ->comment('IN=nhập, OUT=xuất, ADJUST=điều chỉnh kiểm kê');
            $table->integer('quantity')->comment('Số lượng thay đổi (luôn dương)');
            $table->integer('quantity_before')->comment('Tồn kho trước khi thay đổi');
            $table->integer('quantity_after')->comment('Tồn kho sau khi thay đổi');
            $table->string('reference_type', 50)->nullable()
                ->comment('order | inventory_check | manual | import');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('note')->nullable();

            // Audit (chỉ created — không có modified vì movement là immutable)
            $table->dateTime('created')->nullable();
            $table->unsignedBigInteger('created_user_id')->nullable();

            // Index thường dùng để query
            $table->index(['warehouse_id', 'product_id', 'movement_type']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
