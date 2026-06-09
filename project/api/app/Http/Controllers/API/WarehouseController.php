<?php

namespace App\Http\Controllers\API;

use App\Exceptions\WarehouseException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Warehouse\StoreWarehouseRequest;
use App\Http\Resources\WarehouseResource;
use App\Services\WarehouseService;
use App\Support\ApiResponse;
use App\Support\AuthContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function __construct(
        private readonly WarehouseService $warehouseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->warehouseService->list($request->only(['search', 'country', 'per_page']));

        return ApiResponse::success([
            'items' => WarehouseResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $data = $request->validated();

        $auth = AuthContext::from($request);

        try {
            $warehouse = $this->warehouseService->store($data, $auth['id']);
        } catch (WarehouseException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'warehouse' => new WarehouseResource($warehouse),
        ], 'M1001', 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $warehouse = $this->warehouseService->show($id);
        } catch (WarehouseException $e) {
            return ApiResponse::error($e->messageCode, null, $e->status);
        }

        return ApiResponse::success([
            'warehouse' => new WarehouseResource($warehouse),
        ]);
    }
}
