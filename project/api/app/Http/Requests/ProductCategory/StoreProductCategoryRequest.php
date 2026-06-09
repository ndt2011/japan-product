<?php

namespace App\Http\Requests\ProductCategory;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_name' => ['required', 'string', 'max:255'],
            'order_no' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
