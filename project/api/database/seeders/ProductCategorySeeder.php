<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['category_name' => 'Thực phẩm chức năng', 'order_no' => 1],
            ['category_name' => 'Mỹ phẩm / chăm sóc da', 'order_no' => 2],
            ['category_name' => 'Thực phẩm / đồ uống', 'order_no' => 3],
            ['category_name' => 'Thiết bị sức khỏe', 'order_no' => 4],
            ['category_name' => 'Khác', 'order_no' => 99],
        ];

        foreach ($categories as $row) {
            ProductCategory::query()->updateOrCreate(
                ['category_name' => $row['category_name']],
                [
                    'order_no' => $row['order_no'],
                    'disabled_flag' => false,
                    'deleted_flag' => false,
                    'created' => now(),
                ],
            );
        }
    }
}
