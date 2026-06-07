<?php

namespace App\Http\Requests\Ai;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAiCandidatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id' => ['nullable', 'integer', 'exists:ai_search_sessions,id'],
            'items' => ['required', 'array', 'min:1', 'max:10'],
            'items.*.product_name_jp' => ['required', 'string', 'max:255'],
            'items.*.product_name_vn' => ['nullable', 'string', 'max:255'],
            'items.*.image_url' => ['nullable', 'string', 'max:500'],
            'items.*.price_jpy' => ['nullable', 'integer', 'min:0'],
            'items.*.source_url' => ['nullable', 'string', 'max:500'],
            'items.*.source_platform' => ['nullable', 'string', 'max:50'],
            'items.*.description' => ['nullable', 'string'],
        ];
    }
}
