<?php

namespace App\Http\Requests\OrderCost;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderCostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cost_type' => ['required', 'string', 'in:shipping,customs_jp,customs_vn,handling,other'],
            'amount_vnd' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
            'batch_id' => ['nullable', 'integer'],
        ];
    }
}
