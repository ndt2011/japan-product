<?php

namespace App\Http\Requests\ShipmentBatch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShipmentTrackingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tracking_no' => ['nullable', 'string', 'max:100'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'carrier_name' => ['nullable', 'string', 'max:100'],
            'logistics_partner' => ['nullable', 'string', 'max:100'],
        ];
    }
}
