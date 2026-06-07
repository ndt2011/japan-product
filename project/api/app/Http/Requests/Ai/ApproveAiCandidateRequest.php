<?php

namespace App\Http\Requests\Ai;

use App\Support\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ApproveAiCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_category_id' => ['required', 'integer', 'exists:product_categories,id'],
            'product_name_vn' => ['nullable', 'string', 'max:255'],
            'product_cd' => ['nullable', 'string', 'max:50'],
            'cost_jpy' => ['nullable', 'integer', 'min:0'],
            'price_vnd' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'origin' => ['nullable', 'string', 'max:100'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('M0001', $validator->errors(), 422),
        );
    }
}
