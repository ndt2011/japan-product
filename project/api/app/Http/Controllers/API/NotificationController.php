<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $paginator = $this->notificationService->listForUser(
            $auth['user'],
            $auth['type'],
            $request->only(['unread', 'per_page']),
        );

        return ApiResponse::success([
            'items' => NotificationResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function count(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        return ApiResponse::success([
            'unread' => $this->notificationService->unreadCount($auth['user'], $auth['type']),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $notification = $this->notificationService->markRead($id, $auth['user'], $auth['type']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::error('M0002', null, 404);
        }

        return ApiResponse::success([
            'notification' => new NotificationResource($notification),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $updated = $this->notificationService->markAllRead($auth['user'], $auth['type']);

        return ApiResponse::success(['updated' => $updated], 'M0200');
    }
}
