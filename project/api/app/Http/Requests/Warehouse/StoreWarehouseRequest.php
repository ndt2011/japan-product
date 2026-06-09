<?php

namespace App\Http\Requests\Warehouse;

use Illuminate\Foundation\Http\FormRequest;

class StoreWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_cd' => ['nullable', 'string', 'max:50'],
            'warehouse_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'country' => ['nullable', 'string', 'max:10'],
            'manager_name' => ['nullable', 'string', 'max:100'],
            'tel' => ['nullable', 'string', 'max:20'],
        ];
    }
}
