<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_primary' => ['sometimes', 'boolean'],
            'order_no' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
