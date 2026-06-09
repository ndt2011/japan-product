<?php

namespace App\Http\Controllers\API;

use App\Exceptions\BranchException;
use App\Http\Controllers\Controller;
use App\Http\Requests\BranchUser\StoreBranchUserRequest;
use App\Http\Requests\BranchUser\UpdateBranchUserRequest;
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

    public function store(StoreBranchUserRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);
        $data = $request->validated();

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

    public function update(UpdateBranchUserRequest $request, int $id, int $userId): JsonResponse
    {
        $auth = AuthContext::from($request);
        $data = $request->validated();

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
