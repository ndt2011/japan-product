<?php

namespace App\Http\Controllers\API;

use App\Exceptions\AiSearchException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ai\ApproveAiCandidateRequest;
use App\Http\Requests\Ai\RejectAiCandidateRequest;
use App\Http\Requests\Ai\SubmitAiCandidatesRequest;
use App\Http\Resources\AiProductCandidateResource;
use App\Services\AiProductCandidateService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiProductCandidateController extends Controller
{
    public function __construct(
        private readonly AiProductCandidateService $candidateService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->candidateService->list(
            $request->query('status'),
            min((int) $request->query('per_page', 20), 100),
        );

        return ApiResponse::success([
            'items' => AiProductCandidateResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            $candidate = $this->candidateService->show($id);
        } catch (AiSearchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'candidate' => new AiProductCandidateResource($candidate),
        ]);
    }

    public function store(SubmitAiCandidatesRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $created = $this->candidateService->submit(
                $request->validated('items'),
                $auth['type'],
                $auth['id'],
                $request->validated('session_id'),
            );
        } catch (AiSearchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'items' => AiProductCandidateResource::collection($created),
        ], 'M0203', 201);
    }

    public function approve(ApproveAiCandidateRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $candidate = $this->candidateService->approve(
                $id,
                $request->validated(),
                $auth['user'],
                $auth['type'],
            );
        } catch (AiSearchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'candidate' => new AiProductCandidateResource($candidate),
        ], 'M0204');
    }

    public function reject(RejectAiCandidateRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $candidate = $this->candidateService->reject(
                $id,
                $request->validated('reason'),
                $auth['user'],
                $auth['type'],
            );
        } catch (AiSearchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'candidate' => new AiProductCandidateResource($candidate),
        ], 'M0205');
    }
}
