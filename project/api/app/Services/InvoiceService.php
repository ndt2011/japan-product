<?php

namespace App\Services;

use App\Exceptions\InvoiceException;
use App\Models\Admin;
use App\Models\CompanyVn;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Order;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    private const TAX_RATE = 0.10;

    private const DUE_DAYS = 30;

    public function __construct(
        private readonly InvoiceMailService $invoiceMailService,
    ) {}

    public function list(array $filters, Authenticatable $user, string $userType): LengthAwarePaginator
    {
        $query = Invoice::query()
            ->active()
            ->with(['company', 'order'])
            ->orderByDesc('invoice_date')
            ->orderByDesc('id');

        if ($user instanceof CompanyVn) {
            $query->where('company_vn_id', $user->id);
        } elseif (! empty($filters['company_vn_id'])) {
            $query->where('company_vn_id', (int) $filters['company_vn_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('invoice_date', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('invoice_date', '<=', $filters['to_date']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($oq) => $oq->where('order_no', 'like', "%{$search}%"))
                    ->orWhereHas('company', fn ($cq) => $cq->where('company_name', 'like', "%{$search}%"));
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    public function debtSummary(): array
    {
        $this->markOverdueInvoices();

        $unpaid = Invoice::query()
            ->active()
            ->whereIn('status', ['sent', 'overdue'])
            ->with('company')
            ->orderBy('due_date')
            ->get();

        $totalUnpaid = (int) $unpaid->sum(fn (Invoice $inv) => (int) $inv->total_amount);
        $totalOverdue = (int) $unpaid->where('status', 'overdue')->sum(fn (Invoice $inv) => (int) $inv->total_amount);

        return [
            'total_unpaid_vnd' => $totalUnpaid,
            'total_overdue_vnd' => $totalOverdue,
            'invoice_count' => $unpaid->count(),
            'overdue_count' => $unpaid->where('status', 'overdue')->count(),
            'items' => $unpaid->map(fn (Invoice $inv) => [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'company_name' => $inv->company?->company_name,
                'status' => $inv->status,
                'due_date' => $inv->due_date?->toDateString(),
                'total_amount' => (string) $inv->total_amount,
                'days_overdue' => $inv->status === 'overdue'
                    ? max(0, now()->startOfDay()->diffInDays($inv->due_date, false) * -1)
                    : 0,
            ])->values()->all(),
        ];
    }

    public function show(int $id, Authenticatable $user, string $userType): Invoice
    {
        $invoice = Invoice::query()
            ->active()
            ->with(['items', 'company', 'order.details.product'])
            ->find($id);

        if (! $invoice) {
            throw new InvoiceException('M0002', 404);
        }

        $this->assertCanAccess($invoice, $user, $userType);

        return $invoice;
    }

    public function createFromOrder(int $orderId, Admin $admin, ?string $note = null): Invoice
    {
        $order = Order::query()
            ->active()
            ->with(['details.product', 'company'])
            ->find($orderId);

        if (! $order) {
            throw new InvoiceException('M0002', 404);
        }

        if (! in_array($order->status, ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'], true)) {
            throw new InvoiceException('M0510', 409);
        }

        if (! $order->company_vn_id) {
            throw new InvoiceException('M0511', 409);
        }

        if (Invoice::query()->active()->where('order_id', $order->id)->exists()) {
            throw new InvoiceException('M0512', 409);
        }

        return DB::transaction(function () use ($order, $admin, $note) {
            $amountVnd = (int) $order->total_vnd;
            $taxAmount = (int) round($amountVnd * self::TAX_RATE);
            $totalAmount = $amountVnd + $taxAmount;
            $invoiceDate = now()->toDateString();

            $invoice = Invoice::query()->create([
                'order_id' => $order->id,
                'company_vn_id' => $order->company_vn_id,
                'invoice_no' => $this->generateInvoiceNo(),
                'invoice_date' => $invoiceDate,
                'due_date' => now()->addDays(self::DUE_DAYS)->toDateString(),
                'amount_vnd' => $amountVnd,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'draft',
                'note' => $note,
                'created' => now(),
                'created_user_id' => $admin->id,
                'deleted_flag' => false,
            ]);

            foreach ($order->details as $detail) {
                $unitVnd = (int) $detail->unit_price_vnd;
                $qty = (int) $detail->quantity;

                InvoiceItem::query()->create([
                    'invoice_id' => $invoice->id,
                    'order_detail_id' => $detail->id,
                    'product_name' => $detail->product?->product_name ?? "SP #{$detail->product_id}",
                    'quantity' => $qty,
                    'unit_price_vnd' => $unitVnd,
                    'amount' => $unitVnd * $qty,
                ]);
            }

            return $invoice->load(['items', 'company', 'order']);
        });
    }

    public function update(int $id, array $data, Admin $admin): Invoice
    {
        $invoice = $this->show($id, $admin, 'admin');

        if ($invoice->status !== 'draft') {
            throw new InvoiceException('M0513', 409);
        }

        $invoice->update([
            'note' => $data['note'] ?? $invoice->note,
            'due_date' => $data['due_date'] ?? $invoice->due_date,
            'modified' => now(),
            'modified_user_id' => $admin->id,
        ]);

        return $invoice->fresh(['items', 'company', 'order']);
    }

    public function send(int $id, Admin $admin): Invoice
    {
        $invoice = $this->show($id, $admin, 'admin');

        if ($invoice->status !== 'draft') {
            throw new InvoiceException('M0513', 409);
        }

        $invoice->update([
            'status' => 'sent',
            'modified' => now(),
            'modified_user_id' => $admin->id,
        ]);

        $this->invoiceMailService->notifyCompanyInvoiceSent($invoice->fresh(['company', 'order']));

        return $invoice;
    }

    public function pay(int $id, array $data, Admin $admin): Invoice
    {
        $invoice = $this->show($id, $admin, 'admin');

        if (! in_array($invoice->status, ['sent', 'overdue'], true)) {
            throw new InvoiceException('M0514', 409);
        }

        $paidAmount = (int) ($data['paid_amount'] ?? $invoice->total_amount);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paid_amount' => $paidAmount,
            'payment_method' => $data['payment_method'] ?? 'bank_transfer',
            'modified' => now(),
            'modified_user_id' => $admin->id,
        ]);

        return $invoice->fresh(['items', 'company', 'order']);
    }

    public function markOverdueInvoices(): int
    {
        return Invoice::query()
            ->active()
            ->where('status', 'sent')
            ->whereDate('due_date', '<', now()->toDateString())
            ->update([
                'status' => 'overdue',
                'modified' => now(),
            ]);
    }

    private function generateInvoiceNo(): string
    {
        $prefix = 'INV'.now()->format('Ymd');
        $last = Invoice::query()
            ->where('invoice_no', 'like', "{$prefix}%")
            ->orderByDesc('invoice_no')
            ->value('invoice_no');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }

    private function assertCanAccess(Invoice $invoice, Authenticatable $user, string $userType): void
    {
        if ($user instanceof CompanyVn && (int) $invoice->company_vn_id !== (int) $user->id) {
            throw new InvoiceException('M0407', 403);
        }
    }
}
