<?php

namespace App\Http\Requests\Ai;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Support\ApiResponse;

class ProductSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:2', 'max:200'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            ApiResponse::error('M0001', $validator->errors()->toArray(), 422),
        );
    }
}
