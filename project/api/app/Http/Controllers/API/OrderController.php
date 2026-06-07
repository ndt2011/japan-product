<?php

namespace App\Http\Controllers\API;

use App\Exceptions\OrderException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Admin;
use App\Models\CompanyVn;
use App\Services\OrderService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $paginator = $this->orderService->list(
            $request->only(['search', 'status', 'per_page']),
            $auth['user'],
            $auth['type'],
        );

        return ApiResponse::success([
            'items' => OrderResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $order = $this->orderService->show($id, $auth['user'], $auth['type']);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'order' => new OrderResource($order),
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        if ($auth['type'] === 'admin') {
            return ApiResponse::error('M0407', null, 403);
        }

        if ($auth['type'] !== 'company' && ! str_starts_with($auth['type'], 'branch_')) {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            $order = $this->orderService->store(
                $request->validated(),
                $auth['user'],
                $auth['type'],
                (bool) $request->boolean('submit'),
            );
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'order' => new OrderResource($order),
        ], 'M0403', 201);
    }

    public function update(UpdateOrderRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $order = $this->orderService->update($id, $request->validated(), $auth['user'], $auth['type']);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'order' => new OrderResource($order),
        ], 'M0403');
    }

    public function submit(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $order = $this->orderService->submit($id, $auth['user'], $auth['type']);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'order' => new OrderResource($order),
        ], 'M0405');
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if ($auth['type'] !== 'admin') {
            return ApiResponse::error('M0407', null, 403);
        }

        try {
            /** @var Admin $admin */
            $admin = $auth['user'];
            $order = $this->orderService->confirm($id, $admin);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'order' => new OrderResource($order),
        ], 'M0404');
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $order = $this->orderService->cancel($id, $auth['user'], $auth['type']);
        } catch (OrderException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'order' => new OrderResource($order),
        ], 'M0406');
    }
}
