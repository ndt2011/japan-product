<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_price_jpy', 12, 2)->nullable()->after('cost_jpy');
            $table->decimal('selling_price_jpy', 12, 2)->nullable()->after('cost_price_jpy');
            $table->decimal('fee_rate', 5, 4)->default(0.0500)->after('selling_price_jpy');
        });

        DB::table('products')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                DB::table('products')->where('id', $row->id)->update([
                    'cost_price_jpy' => $row->cost_jpy,
                    'selling_price_jpy' => $row->cost_jpy,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['cost_price_jpy', 'selling_price_jpy', 'fee_rate']);
        });
    }
};
