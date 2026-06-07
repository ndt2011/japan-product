<?php

namespace App\Http\Requests\Product;

class UpdateProductRequest extends StoreProductRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'product_category_id' => ['sometimes', 'integer', 'exists:product_categories,id'],
            'product_name' => ['sometimes', 'string', 'max:255'],
        ]);
    }
}
