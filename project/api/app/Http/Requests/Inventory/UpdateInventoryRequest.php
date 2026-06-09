<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'min_stock_qty' => ['nullable', 'integer', 'min:0'],
            'restock_eta' => ['nullable', 'date'],
            'restock_status' => ['nullable', 'in:NORMAL,LOW,CRITICAL,ON_ORDER'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
