<?php

namespace App\Http\Requests\Product;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_category_id' => ['required', 'integer', 'exists:product_categories,id'],
            'product_cd' => ['nullable', 'string', 'max:50'],
            'product_name' => ['required', 'string', 'max:255'],
            'product_name_jp' => ['nullable', 'string', 'max:255'],
            'name_vi' => ['nullable', 'string', 'max:300'],
            'description_vi' => ['nullable', 'string', 'max:2000'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers_jp,id'],
            'spec' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:20'],
            'cost_jpy' => ['nullable', 'integer', 'min:0'],
            'price_vnd' => ['nullable', 'integer', 'min:0'],
            'import_tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'origin' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'memo' => ['nullable', 'string'],
            'disabled_flag' => ['nullable', 'boolean'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('M0001', $validator->errors(), 422),
        );
    }
}
