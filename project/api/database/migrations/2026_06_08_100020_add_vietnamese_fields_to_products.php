<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('name_vi', 300)->nullable()->after('product_name_jp')
                ->comment('Tên tiếng Việt cho AI catalog search');
            $table->text('description_vi')->nullable()->after('description')
                ->comment('Mô tả tiếng Việt cho AI catalog search');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['name_vi', 'description_vi']);
        });
    }
};
