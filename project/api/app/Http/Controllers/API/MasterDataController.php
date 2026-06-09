<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use App\Models\ProductCategory;
use App\Models\SupplierJp;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    public function suppliers(Request $request): JsonResponse
    {
        $query = SupplierJp::query()->where('deleted_flag', false);

        if (! $request->boolean('include_disabled')) {
            $query->where('disabled_flag', false);
        }

        $columns = ['id', 'supplier_cd', 'supplier_name', 'supplier_name_jp'];
        if ($request->boolean('detail')) {
            $columns = array_merge($columns, [
                'address', 'tel', 'email', 'contact_name', 'disabled_flag', 'memo',
            ]);
        }

        $items = $query->orderBy('supplier_name')->get($columns);

        return ApiResponse::success(['items' => $items]);
    }

    public function categories(): JsonResponse
    {
        $items = ProductCategory::query()
            ->where('disabled_flag', false)
            ->where('deleted_flag', false)
            ->orderBy('order_no')
            ->get(['id', 'category_name', 'order_no']);

        return ApiResponse::success(['items' => $items]);
    }

    public function currentExchangeRate(): JsonResponse
    {
        $rate = ExchangeRate::query()
            ->where('from_currency', 'JPY')
            ->where('to_currency', 'VND')
            ->where('apply_date', '<=', now()->toDateString())
            ->orderByDesc('apply_date')
            ->first();

        return ApiResponse::success([
            'from_currency' => 'JPY',
            'to_currency' => 'VND',
            'rate' => $rate?->rate,
            'apply_date' => $rate?->apply_date?->toDateString(),
        ]);
    }
}
