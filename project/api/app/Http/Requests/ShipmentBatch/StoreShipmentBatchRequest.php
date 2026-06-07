<?php

namespace App\Http\Requests\ShipmentBatch;

use Illuminate\Foundation\Http\FormRequest;

class StoreShipmentBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'batch_name' => ['required', 'string', 'max:255'],
            'order_ids' => ['required', 'array', 'min:1'],
            'order_ids.*' => ['integer'],
            'logistics_partner' => ['nullable', 'string', 'max:255'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'estimated_departure_date' => ['nullable', 'date'],
        ];
    }
}
