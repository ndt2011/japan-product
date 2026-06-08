<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ProfileService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        return ApiResponse::success([
            'profile' => $this->profileService->show($auth['user'], $auth['type']),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        $validated = $request->validate([
            'full_name' => ['nullable', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'avatar_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        return ApiResponse::success([
            'profile' => $this->profileService->update($auth['user'], $auth['type'], $validated),
        ], 'M0200');
    }
}
