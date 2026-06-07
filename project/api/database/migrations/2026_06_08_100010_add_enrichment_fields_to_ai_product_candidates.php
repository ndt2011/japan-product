<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_product_candidates', function (Blueprint $table) {
            $table->unsignedBigInteger('suggested_category_id')->nullable()->after('description');
            $table->string('suggested_category_name', 100)->nullable()->after('suggested_category_id');
            $table->text('usage_instructions')->nullable()->after('suggested_category_name');
            $table->string('spec', 255)->nullable()->after('usage_instructions');
            $table->string('data_source', 50)->nullable()->after('spec');

            $table->foreign('suggested_category_id', 'fk_ai_candidates_category')
                ->references('id')
                ->on('product_categories')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ai_product_candidates', function (Blueprint $table) {
            $table->dropForeign('fk_ai_candidates_category');
            $table->dropColumn([
                'suggested_category_id',
                'suggested_category_name',
                'usage_instructions',
                'spec',
                'data_source',
            ]);
        });
    }
};
