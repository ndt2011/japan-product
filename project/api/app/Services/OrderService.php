<?php

namespace App\Services;

use App\Exceptions\OrderException;
use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\CompanyVn;
use App\Models\ExchangeRate;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Repositories\OrderRepository;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly InventoryService $inventoryService,
        private readonly OrderMailService $orderMailService,
    ) {}

    public function list(array $filters, Authenticatable $user, string $userType): LengthAwarePaginator
    {
        if ($user instanceof CompanyVn) {
            $filters['company_vn_id'] = $user->id;
        } elseif ($user instanceof BranchUser) {
            $filters['branch_id'] = $user->branch_id;
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $this->orderRepository->paginate($filters, $perPage);
    }

    public function show(int $id, Authenticatable $user, string $userType): Order
    {
        $order = $this->orderRepository->findDetail($id);

        if (! $order) {
            throw new OrderException('M0002', 404);
        }

        $this->assertCanAccess($order, $user, $userType);

        return $order;
    }

    public function store(array $data, Authenticatable $user, string $userType, bool $submit = false): Order
    {
        $order = DB::transaction(function () use ($data, $user, $userType, $submit) {
            $lines = $data['items'] ?? [];
            $status = $submit ? 'PENDING' : ($data['status'] ?? 'DRAFT');

            if ($status === 'PENDING') {
                foreach ($lines as $line) {
                    $this->inventoryService->assertCanReserve((int) $line['product_id'], (int) $line['quantity']);
                }
            }

            $rate = $this->currentExchangeRate();
            $totals = $this->calculateTotals($lines, $rate);

            $orderPayload = [
                'order_no' => $this->orderRepository->generateOrderNo(),
                'status' => $status,
                'order_date' => now()->toDateString(),
                'expected_date' => $data['expected_date'] ?? null,
                'total_jpy' => (string) $totals['total_jpy'],
                'total_vnd' => (string) $totals['total_vnd'],
                'exchange_rate' => $rate,
                'biko' => $data['biko'] ?? null,
                'created' => now(),
                'created_user_id' => $user->id,
                'deleted_flag' => false,
            ];

            if (str_starts_with($userType, 'branch_') && $user instanceof BranchUser) {
                $orderPayload['branch_id'] = $user->branch_id;
                $orderPayload['company_vn_id'] = null;
            } elseif ($user instanceof CompanyVn) {
                $orderPayload['company_vn_id'] = $user->id;
                $orderPayload['branch_id'] = null;
            } else {
                throw new OrderException('M0407', 403);
            }

            $order = $this->orderRepository->create($orderPayload);

            $this->syncDetails($order, $lines, $user->id);

            if ($status === 'PENDING') {
                foreach ($lines as $line) {
                    $this->inventoryService->reserve((int) $line['product_id'], (int) $line['quantity']);
                }
            }

            return $this->orderRepository->findDetail($order->id);
        });

        if ($order->status === 'PENDING') {
            $this->orderMailService->notifyAdminsNewOrder($order);
        }

        return $order;
    }

    public function update(int $id, array $data, Authenticatable $user, string $userType): Order
    {
        $order = $this->show($id, $user, $userType);

        if ($order->status !== 'DRAFT') {
            throw new OrderException('M0402', 409);
        }

        $this->assertCanModify($order, $user, $userType);

        return DB::transaction(function () use ($order, $data, $user) {
            $lines = $data['items'] ?? null;
            $rate = $this->currentExchangeRate();

            if ($lines !== null) {
                OrderDetail::query()->where('order_id', $order->id)->update(['deleted_flag' => true]);
                $totals = $this->calculateTotals($lines, $rate);
                $this->syncDetails($order, $lines, $user->id);
            } else {
                $totals = [
                    'total_jpy' => (int) $order->total_jpy,
                    'total_vnd' => (int) $order->total_vnd,
                ];
            }

            return $this->orderRepository->update($order, [
                'expected_date' => $data['expected_date'] ?? $order->expected_date,
                'biko' => $data['biko'] ?? $order->biko,
                'total_jpy' => (string) ($totals['total_jpy'] ?? $order->total_jpy),
                'total_vnd' => (string) ($totals['total_vnd'] ?? $order->total_vnd),
                'exchange_rate' => $rate,
                'modified' => now(),
                'modified_user_id' => $user->id,
            ]);
        });
    }

    public function submit(int $id, Authenticatable $user, string $userType): Order
    {
        $order = $this->show($id, $user, $userType);

        if ($order->status !== 'DRAFT') {
            throw new OrderException('M0402', 409);
        }

        $this->assertCanModify($order, $user, $userType);

        $updated = DB::transaction(function () use ($order, $user) {
            foreach ($order->details as $detail) {
                $this->inventoryService->reserve($detail->product_id, $detail->quantity);
            }

            return $this->orderRepository->update($order, [
                'status' => 'PENDING',
                'modified' => now(),
                'modified_user_id' => $user->id,
            ]);
        });

        $this->orderMailService->notifyAdminsNewOrder($updated);

        return $updated;
    }

    public function confirm(int $id, Admin $admin): Order
    {
        $order = $this->orderRepository->findDetail($id);

        if (! $order) {
            throw new OrderException('M0002', 404);
        }

        if ($order->status !== 'PENDING') {
            throw new OrderException('M0402', 409);
        }

        $lockedRate = $this->currentExchangeRate();

        $updated = $this->orderRepository->update($order, [
            'status' => 'CONFIRMED',
            'exchange_rate' => $lockedRate,
            'handler_admin_id' => $admin->id,
            'modified' => now(),
            'modified_user_id' => $admin->id,
        ]);

        $this->orderMailService->notifyCompanyOrderConfirmed($updated);

        return $updated;
    }

    public function cancel(int $id, Authenticatable $user, string $userType): Order
    {
        $order = $this->show($id, $user, $userType);

        if (! in_array($order->status, ['DRAFT', 'PENDING'], true)) {
            throw new OrderException('M0402', 409);
        }

        return DB::transaction(function () use ($order) {
            if ($order->status === 'PENDING') {
                foreach ($order->details as $detail) {
                    $this->inventoryService->release($detail->product_id, $detail->quantity);
                }
            }

            return $this->orderRepository->update($order, [
                'status' => 'CANCELLED',
                'modified' => now(),
            ]);
        });
    }

    private function syncDetails(Order $order, array $lines, int $userId): void
    {
        foreach ($lines as $line) {
            $product = Product::query()->active()->find($line['product_id']);

            if (! $product) {
                throw new OrderException('M0002', 404);
            }

            $qty = (int) $line['quantity'];
            $unitJpy = (int) ($product->cost_jpy ?? 0);
            $unitVnd = (int) ($product->price_vnd ?? 0);

            OrderDetail::query()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $qty,
                'unit_price_jpy' => $unitJpy,
                'unit_price_vnd' => (string) $unitVnd,
                'subtotal_vnd' => (string) ($unitVnd * $qty),
                'import_tax_rate' => $product->import_tax_rate,
                'comment' => $line['comment'] ?? null,
                'created' => now(),
                'created_user_id' => $userId,
                'deleted_flag' => false,
            ]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     * @return array{total_jpy: int, total_vnd: int}
     */
    private function calculateTotals(array $lines, float $rate): array
    {
        $totalJpy = 0;
        $totalVnd = 0;

        foreach ($lines as $line) {
            $product = Product::query()->find($line['product_id']);
            if (! $product) {
                continue;
            }
            $qty = (int) $line['quantity'];
            $totalJpy += (int) ($product->cost_jpy ?? 0) * $qty;
            $totalVnd += (int) ($product->price_vnd ?? 0) * $qty;
        }

        return ['total_jpy' => $totalJpy, 'total_vnd' => $totalVnd];
    }

    private function currentExchangeRate(): float
    {
        $rate = ExchangeRate::query()
            ->where('from_currency', 'JPY')
            ->where('to_currency', 'VND')
            ->where('apply_date', '<=', now()->toDateString())
            ->orderByDesc('apply_date')
            ->value('rate');

        return (float) ($rate ?? 170.5);
    }

    private function assertCanAccess(Order $order, Authenticatable $user, string $userType): void
    {
        if ($userType === 'company' && (int) $order->company_vn_id !== (int) $user->id) {
            throw new OrderException('M0407', 403);
        }

        if (str_starts_with($userType, 'branch_') && $user instanceof BranchUser) {
            if ((int) $order->branch_id !== (int) $user->branch_id) {
                throw new OrderException('M0407', 403);
            }
        }
    }

    private function assertCanModify(Order $order, Authenticatable $user, string $userType): void
    {
        if ($userType === 'company') {
            if ((int) $order->company_vn_id !== (int) $user->id) {
                throw new OrderException('M0407', 403);
            }

            return;
        }

        if (str_starts_with($userType, 'branch_') && $user instanceof BranchUser) {
            if ((int) $order->branch_id !== (int) $user->branch_id) {
                throw new OrderException('M0407', 403);
            }

            return;
        }

        throw new OrderException('M0407', 403);
    }
}
