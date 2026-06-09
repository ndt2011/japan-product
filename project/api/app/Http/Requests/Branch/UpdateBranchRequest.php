<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_name' => ['sometimes', 'string', 'max:255'],
            'region' => ['sometimes', 'string', 'max:50'],
            'province' => ['sometimes', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'tel' => ['nullable', 'string', 'max:20'],
        ];
    }
}
