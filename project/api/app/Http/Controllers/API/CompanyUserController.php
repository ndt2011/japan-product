<?php

namespace App\Http\Controllers\API;

use App\Exceptions\AuthException;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyUserResource;
use App\Services\CompanyUserService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyUserController extends Controller
{
    public function __construct(
        private readonly CompanyUserService $companyUserService,
    ) {}

    public function index(): JsonResponse
    {
        $items = $this->companyUserService->list();

        return ApiResponse::success([
            'items' => CompanyUserResource::collection($items),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login_id' => ['required', 'string', 'max:50', 'unique:companies_vn,login_id'],
            'password' => ['required', 'string', 'min:8'],
            'company_cd' => ['nullable', 'string', 'max:50'],
            'company_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'tel' => ['nullable', 'string', 'max:20'],
            'province' => ['nullable', 'string', 'max:100'],
        ]);

        $auth = AuthContext::from($request);

        try {
            $company = $this->companyUserService->store($data, $auth['id']);
        } catch (AuthException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new CompanyUserResource($company),
        ], 'M0111', 201);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $company = $this->companyUserService->toggle($id, $auth['id']);
        } catch (AuthException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'user' => new CompanyUserResource($company),
        ], 'M0000');
    }
}
