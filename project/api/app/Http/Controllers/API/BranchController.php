<?php

namespace App\Http\Controllers\API;

use App\Exceptions\BranchException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\BranchUser;
use App\Services\BranchService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function __construct(
        private readonly BranchService $branchService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->branchService->list($request->only(['search', 'region', 'province', 'per_page']));

        return ApiResponse::success([
            'items' => BranchResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreBranchRequest $request): JsonResponse
    {
        $data = $request->validated();

        $auth = AuthContext::from($request);

        try {
            $branch = $this->branchService->store($data, $auth['id']);
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'branch' => new BranchResource($branch),
        ], 'M1200', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $branch = $this->branchService->show($id);
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'branch' => new BranchResource($branch),
        ]);
    }

    public function update(UpdateBranchRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();

        $auth = AuthContext::from($request);

        try {
            $branch = $this->branchService->update($id, $data, $auth['id']);
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'branch' => new BranchResource($branch),
        ], 'M0000');
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $branch = $this->branchService->toggle($id, $auth['id']);
        } catch (BranchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'branch' => new BranchResource($branch),
        ], 'M0000');
    }

    public function myBranch(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        if (! $auth['user'] instanceof BranchUser) {
            return ApiResponse::error('M0403', null, 403);
        }

        /** @var BranchUser $user */
        $user = $auth['user'];
        $user->load('branch');

        if (! $user->branch) {
            return ApiResponse::error('M1201', null, 404);
        }

        return ApiResponse::success([
            'branch' => new BranchResource($user->branch),
            'user' => [
                'id' => $user->id,
                'login_id' => $user->login_id,
                'full_name' => $user->full_name,
                'role' => $user->role,
                'user_type' => $user->user_type,
            ],
        ]);
    }
}
