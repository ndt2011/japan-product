<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_product_candidates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ai_search_session_id')->nullable();
            $table->string('product_name_jp', 255);
            $table->string('product_name_vn', 255)->nullable();
            $table->string('image_url', 500)->nullable();
            $table->unsignedInteger('price_jpy')->nullable();
            $table->string('source_url', 500)->nullable();
            $table->string('source_platform', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->text('reject_reason')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('created_user_type', 20);
            $table->unsignedBigInteger('created_user_id');
            $table->string('reviewed_user_type', 20)->nullable();
            $table->unsignedBigInteger('reviewed_user_id')->nullable();
            $table->dateTime('created')->nullable();
            $table->dateTime('modified')->nullable();
            $table->boolean('deleted_flag')->default(false);

            $table->foreign('ai_search_session_id', 'fk_ai_candidates_session')
                ->references('id')
                ->on('ai_search_sessions')
                ->nullOnDelete();
            $table->foreign('product_id', 'fk_ai_candidates_product')
                ->references('id')
                ->on('products')
                ->nullOnDelete();
            $table->index(['status', 'deleted_flag'], 'idx_ai_candidates_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_product_candidates');
    }
};
