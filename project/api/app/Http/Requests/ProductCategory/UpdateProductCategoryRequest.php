<?php

namespace App\Http\Requests\ProductCategory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_name' => ['sometimes', 'string', 'max:255'],
            'order_no' => ['nullable', 'integer', 'min:0'],
            'disabled_flag' => ['nullable', 'boolean'],
        ];
    }
}
