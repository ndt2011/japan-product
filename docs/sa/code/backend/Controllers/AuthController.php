<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    // POST /auth/login
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login_id'    => 'required|string',
            'password'    => 'required|string',
            'remember_me' => 'boolean',
        ]);

        $user = $this->authService->findUser(
            $request->login_id,
            $request->password
        );

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'M4011', // Login ID hoặc mật khẩu không đúng
            ], 401);
        }

        $result = $this->authService->createToken($user, $request->boolean('remember_me'));

        return response()->json([
            'success' => true,
            'message' => 'M0000',
            'data'    => $result,
        ]);
    }

    // POST /auth/logout
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'M0001',
        ]);
    }

    // GET /auth/me
    public function me(Request $request): JsonResponse
    {
        $user     = $request->user();
        $userType = $user->user_type;

        $data = match (true) {
            $userType === 'admin' => [
                'id'        => $user->id,
                'user_type' => $userType,
                'login_id'  => $user->login_id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
            ],
            $userType === 'company_vn' => [
                'id'           => $user->id,
                'user_type'    => $userType,
                'login_id'     => $user->login_id,
                'company_name' => $user->company_name,
                'contact_name' => $user->contact_name,
                'email'        => $user->email,
            ],
            str_starts_with($userType, 'branch_') => [
                'id'        => $user->id,
                'user_type' => $userType,
                'login_id'  => $user->login_id,
                'full_name' => $user->full_name,
                'role'      => $user->role,
                'branch_id' => $user->branch_id,
                'branch'    => $user->branch?->only(['id', 'branch_cd', 'branch_name', 'region']),
            ],
            default => ['id' => $user->id, 'user_type' => $userType],
        };

        return response()->json(['success' => true, 'data' => $data]);
    }
}
