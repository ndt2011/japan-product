<?php

namespace App\Http\Controllers\API;

use App\Exceptions\AuthException;
use App\Http\Controllers\Controller;
use App\Http\Presenters\AuthUserPresenter;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->validated('login_id'),
                $request->validated('password'),
                $request->ip() ?? 'unknown',
                (bool) $request->validated('remember_me', false),
            );
        } catch (AuthException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => AuthUserPresenter::present($result['user'], $result['user_type']),
            'token' => $result['token'],
            'token_type' => 'Bearer',
            'expires_at' => $result['expires_at'],
        ], 'M0103');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success(null, 'M0000');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $userType = $user instanceof \App\Models\CompanyVn ? 'company' : 'admin';

        return ApiResponse::success([
            'user' => AuthUserPresenter::present($user, $userType),
        ]);
    }
}
