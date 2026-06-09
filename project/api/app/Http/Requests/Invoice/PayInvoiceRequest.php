<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class PayInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paid_amount' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'in:bank_transfer,cash,other'],
        ];
    }
}
