<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_cd' => ['nullable', 'string', 'max:50'],
            'supplier_name' => ['sometimes', 'string', 'max:255'],
            'supplier_name_jp' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'tel' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'memo' => ['nullable', 'string'],
            'disabled_flag' => ['nullable', 'boolean'],
        ];
    }
}
