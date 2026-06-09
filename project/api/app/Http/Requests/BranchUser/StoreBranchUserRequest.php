<?php

namespace App\Http\Requests\BranchUser;

use App\Support\AuthContext;
use Illuminate\Foundation\Http\FormRequest;

class StoreBranchUserRequest extends FormRequest
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
            'login_id' => ['required', 'string', 'max:100', 'unique:branch_users,login_id'],
            'password' => ['required', 'string', 'min:8'],
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email'],
            'role' => ['required', 'in:'.$roleRule],
        ];
    }
}
