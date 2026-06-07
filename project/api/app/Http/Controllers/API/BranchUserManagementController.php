<?php

namespace App\Http\Controllers\API;

use App\Exceptions\BranchException;
use App\Http\Controllers\Controller;
use App\Http\Resources\BranchUserResource;
use App\Models\BranchUser;
use App\Services\BranchUserService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchUserManagementController extends Controller
{
    public function __construct(
        private readonly BranchUserService $branchUserService,
    ) {}

    public function index(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $users = $this->branchUserService->list(
                $id,
                $auth['user'] instanceof BranchUser ? $auth['user'] : $auth['id'],
                $auth['type'],
            );
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'items' => BranchUserResource::collection($users),
        ]);
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);
        $roleRule = $auth['type'] === 'admin' ? 'manager,staff' : 'staff';

        $data = $request->validate([
            'login_id' => ['required', 'string', 'max:100', 'unique:branch_users,login_id'],
            'password' => ['required', 'string', 'min:8'],
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email'],
            'role' => ['required', 'in:'.$roleRule],
        ]);

        try {
            $user = $this->branchUserService->store(
                $id,
                $data,
                $auth['user'] instanceof BranchUser ? $auth['user'] : $auth['id'],
                $auth['type'],
            );
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new BranchUserResource($user),
        ], 'M1202', 201);
    }

    public function update(Request $request, int $id, int $userId): JsonResponse
    {
        $auth = AuthContext::from($request);
        $roleRule = $auth['type'] === 'admin' ? 'manager,staff' : 'staff';

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:150'],
            'email' => ['nullable', 'email'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'in:'.$roleRule],
        ]);

        try {
            $user = $this->branchUserService->update(
                $id,
                $userId,
                $data,
                $auth['user'] instanceof BranchUser ? $auth['user'] : $auth['id'],
                $auth['type'],
            );
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new BranchUserResource($user),
        ], 'M0000');
    }

    public function toggle(Request $request, int $id, int $userId): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $user = $this->branchUserService->toggle(
                $id,
                $userId,
                $auth['user'] instanceof BranchUser ? $auth['user'] : $auth['id'],
                $auth['type'],
            );
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new BranchUserResource($user),
        ], 'M0000');
    }
}
