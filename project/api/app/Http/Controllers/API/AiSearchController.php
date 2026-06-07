<?php

namespace App\Http\Controllers\API;

use App\Exceptions\AiSearchException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ai\StartAiSearchRequest;
use App\Http\Resources\AiSearchSessionResource;
use App\Services\AiSearchService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiSearchController extends Controller
{
    public function __construct(
        private readonly AiSearchService $aiSearchService,
    ) {}

    public function store(StartAiSearchRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $session = $this->aiSearchService->start(
                $request->validated('keyword'),
                $auth['type'],
                $auth['id'],
            );
        } catch (AiSearchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'session' => new AiSearchSessionResource($session),
        ], 'M0000', 202);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $session = $this->aiSearchService->show($id, $auth['type'], $auth['id']);
            $message = $this->aiSearchService->resolveMessage($session);
        } catch (AiSearchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        if ($message) {
            return ApiResponse::success([
                'session' => new AiSearchSessionResource($session),
            ], $message);
        }

        return ApiResponse::success([
            'session' => new AiSearchSessionResource($session),
        ]);
    }
}
