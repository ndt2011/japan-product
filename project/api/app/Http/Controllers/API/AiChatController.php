<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Services\Ai\AiChatService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AI Chat nhân viên
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 5
 * screen: docs/sa/2-102_AI_Chat_Nhân_viên.xlsx
 */
class AiChatController extends Controller
{
    public function __construct(
        private readonly AiChatService $chatService,
    ) {}

    /**
     * POST /ai/chat
     * Gửi tin nhắn và nhận reply từ AI nhân viên.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message'         => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:ai_conversations,id'],
        ]);

        $auth = AuthContext::from($request);

        try {
            $result = $this->chatService->chat(
                user:           $auth['user'],
                userType:       $auth['type'],
                message:        $validated['message'],
                conversationId: $validated['conversation_id'] ?? null,
            );
        } catch (\Throwable $e) {
            report($e);

            return ApiResponse::error('M0001', [
                'ai_chat' => [$e->getMessage()],
            ], 500);
        }

        return ApiResponse::success($result, 'M0200');
    }

    /**
     * GET /ai/conversations
     * Danh sách phiên chat của user hiện tại.
     */
    public function conversations(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        $conversations = AiConversation::query()
            ->where('user_type', $auth['type'])
            ->where('user_id', $auth['id'])
            ->orderByDesc('modified')
            ->paginate(min((int) $request->input('per_page', 20), 50));

        return ApiResponse::success([
            'items' => $conversations->items(),
            'pagination' => [
                'page'     => $conversations->currentPage(),
                'per_page' => $conversations->perPage(),
                'total'    => $conversations->total(),
            ],
        ]);
    }

    /**
     * GET /ai/conversations/{id}/messages
     * Toàn bộ tin nhắn trong 1 phiên chat.
     */
    public function messages(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        $conversation = AiConversation::query()
            ->where('user_type', $auth['type'])
            ->where('user_id', $auth['id'])
            ->findOrFail($id);

        $messages = $conversation->messages()
            ->select(['id', 'role', 'content', 'intent', 'created'])
            ->get();

        return ApiResponse::success([
            'conversation' => [
                'id'         => $conversation->id,
                'session_id' => $conversation->session_id,
                'title'      => $conversation->title,
                'created'    => $conversation->created?->toIso8601String(),
            ],
            'messages' => $messages,
        ]);
    }
}
