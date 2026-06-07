<?php

namespace App\Http\Requests\ShipmentBatch;

use App\Repositories\ShipmentBatchRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdvanceShipmentBatchStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(ShipmentBatchRepository::STATUS_FLOW)],
        ];
    }
}
