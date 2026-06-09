<?php

namespace App\Http\Requests\BranchUser;

use App\Support\AuthContext;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $auth = AuthContext::from($this);
        $roleRule = $auth['type'] === 'admin' ? 'manager,staff' : 'staff';

        return [
            'full_name' => ['sometimes', 'string', 'max:150'],
            'email' => ['nullable', 'email'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'in:'.$roleRule],
        ];
    }
}
