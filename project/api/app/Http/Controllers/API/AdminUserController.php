<?php

namespace App\Http\Controllers\API;

use App\Exceptions\AuthException;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Services\AdminUserService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $adminUserService,
    ) {}

    public function index(): JsonResponse
    {
        $items = $this->adminUserService->list();

        return ApiResponse::success([
            'items' => AdminUserResource::collection($items),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login_id' => ['required', 'string', 'max:50', 'unique:admins,login_id'],
            'password' => ['required', 'string', 'min:8'],
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $auth = AuthContext::from($request);

        try {
            $admin = $this->adminUserService->store($data, $auth['id']);
        } catch (AuthException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new AdminUserResource($admin),
        ], 'M0110', 201);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $admin = $this->adminUserService->toggle($id, $auth['id']);
        } catch (AuthException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new AdminUserResource($admin),
        ], 'M0000');
    }
}
