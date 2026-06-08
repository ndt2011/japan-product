<?php

namespace App\Http\Controllers\API;

use App\Exceptions\OrderException;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Services\OrderCostService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderCostController extends Controller
{
    public function __construct(
        private readonly OrderCostService $orderCostService,
    ) {}

    public function index(Request $request, int $orderId): JsonResponse
    {
        try {
            $items = $this->orderCostService->list($orderId);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'items' => $items->map(fn ($c) => [
                'id'          => $c->id,
                'order_id'    => $c->order_id,
                'batch_id'    => $c->batch_id,
                'cost_type'   => $c->cost_type,
                'amount_vnd'  => (string) $c->amount_vnd,
                'note'        => $c->note,
                'created'     => $c->created?->toIso8601String(),
            ]),
            'total_vnd' => (string) $items->sum('amount_vnd'),
        ]);
    }

    public function store(Request $request, int $orderId): JsonResponse
    {
        $auth = AuthContext::from($request);
        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        $data = $request->validate([
            'cost_type'   => ['required', 'string', 'in:shipping,customs_jp,customs_vn,handling,other'],
            'amount_vnd'  => ['required', 'integer', 'min:1'],
            'note'        => ['nullable', 'string', 'max:500'],
            'batch_id'    => ['nullable', 'integer'],
        ]);

        try {
            $cost = $this->orderCostService->store($orderId, $data, $auth['user']);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'cost' => [
                'id'         => $cost->id,
                'cost_type'  => $cost->cost_type,
                'amount_vnd' => (string) $cost->amount_vnd,
                'note'       => $cost->note,
            ],
        ], 'M0000', 201);
    }

    public function destroy(Request $request, int $orderId, int $costId): JsonResponse
    {
        $auth = AuthContext::from($request);
        if (! $auth['user'] instanceof Admin) {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            $this->orderCostService->destroy($orderId, $costId);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success(null, 'M0000');
    }
}
