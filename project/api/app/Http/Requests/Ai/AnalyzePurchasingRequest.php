<?php

namespace App\Http\Requests\Ai;

use Illuminate\Foundation\Http\FormRequest;

class AnalyzePurchasingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'max:500'],
            'budget_jpy' => ['nullable', 'integer', 'min:1'],
            'qty' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'preferences' => ['nullable', 'string', 'max:500'],
        ];
    }
}
