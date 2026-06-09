<?php

namespace App\Http\Controllers\API;

use App\Exceptions\ShipmentBatchException;
use App\Http\Controllers\Controller;
use App\Http\Requests\ShipmentBatch\AdvanceShipmentBatchStatusRequest;
use App\Http\Requests\ShipmentBatch\UpdateShipmentTrackingRequest;
use App\Http\Requests\ShipmentBatch\StoreShipmentBatchRequest;
use App\Http\Requests\ShipmentBatch\UpdateShipmentBatchRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ShipmentBatchResource;
use App\Services\ShipmentBatchService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentBatchController extends Controller
{
    public function __construct(
        private readonly ShipmentBatchService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);
        $paginator = $this->service->list(
            $request->only(['search', 'status', 'per_page']),
            $auth['user'],
            $auth['type'],
        );

        return ApiResponse::success([
            'items' => ShipmentBatchResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function availableOrders(Request $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $orders = $this->service->availableOrders($auth['type']);
        } catch (ShipmentBatchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'items' => OrderResource::collection($orders),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        try {
            $batch = $this->service->show($id, $auth['user'], $auth['type']);
        } catch (ShipmentBatchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'batch' => new ShipmentBatchResource($batch),
        ]);
    }

    public function store(StoreShipmentBatchRequest $request): JsonResponse
    {
        $auth = AuthContext::from($request);

        if ($auth['type'] !== 'admin') {
            return ApiResponse::error('M0507', null, 403);
        }

        try {
            $batch = $this->service->store($request->validated(), $auth['user']);
        } catch (ShipmentBatchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'batch' => new ShipmentBatchResource($batch),
        ], 'M0506', 201);
    }

    public function update(UpdateShipmentBatchRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if ($auth['type'] !== 'admin') {
            return ApiResponse::error('M0507', null, 403);
        }

        try {
            $batch = $this->service->update($id, $request->validated(), $auth['user']);
        } catch (ShipmentBatchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'batch' => new ShipmentBatchResource($batch),
        ], 'M0506');
    }

    public function setTracking(UpdateShipmentTrackingRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if ($auth['type'] !== 'admin') {
            return ApiResponse::error('M0507', null, 403);
        }

        $validated = $request->validated();

        try {
            $batch = $this->service->setTracking($id, $validated, $auth['user']);
        } catch (ShipmentBatchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'batch' => new ShipmentBatchResource($batch),
        ], 'M0506');
    }

    public function advanceStatus(AdvanceShipmentBatchStatusRequest $request, int $id): JsonResponse
    {
        $auth = AuthContext::from($request);

        if ($auth['type'] !== 'admin') {
            return ApiResponse::error('M0507', null, 403);
        }

        try {
            $batch = $this->service->advanceStatus(
                $id,
                $request->validated('status'),
                $auth['user'],
                $request->validated('warehouse_id') ? (int) $request->validated('warehouse_id') : null,
            );
        } catch (ShipmentBatchException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'batch' => new ShipmentBatchResource($batch),
        ], 'M0506');
    }
}
