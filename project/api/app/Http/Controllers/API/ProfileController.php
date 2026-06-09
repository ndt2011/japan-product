<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\StoreProfileAvatarRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
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

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        return ApiResponse::success([
            'profile' => $this->profileService->update($auth['user'], $auth['type'], $request->validated()),
        ], 'M0200');
    }

    public function uploadAvatar(StoreProfileAvatarRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        return ApiResponse::success([
            'profile' => $this->profileService->uploadAvatar(
                $auth['user'],
                $auth['type'],
                $request->file('avatar'),
            ),
        ], 'M0200');
    }
}
