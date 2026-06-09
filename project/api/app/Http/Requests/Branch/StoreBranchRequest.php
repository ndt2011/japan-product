<?php

namespace App\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_cd' => ['required', 'string', 'max:50'],
            'branch_name' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:50'],
            'province' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'tel' => ['nullable', 'string', 'max:20'],
        ];
    }
}
