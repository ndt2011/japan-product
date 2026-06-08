<?php

namespace App\Http\Resources;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() instanceof Admin;

        return [
            'id'             => $this->id,
            'order_id'       => $this->order_id,
            'order_no'       => $this->order?->order_no,
            'company_vn_id'  => $this->company_vn_id,
            'company_name'   => $this->company?->company_name,
            'branch_id'      => $this->branch_id,
            'invoice_no'     => $this->invoice_no,
            'invoice_date'   => $this->invoice_date?->toDateString(),
            'due_date'       => $this->due_date?->toDateString(),
            'locked_rate'    => $this->locked_rate !== null ? (string) $this->locked_rate : null,
            'fee_rate'       => $this->fee_rate !== null ? (string) $this->fee_rate : null,
            // Phân tách tiền — Admin thấy đầy đủ, đại lý chỉ thấy total
            'subtotal_vnd'   => $this->when($isAdmin, fn () => (string) $this->subtotal_vnd),
            'fee_amount_vnd' => (string) ($this->fee_amount_vnd ?? 0),
            'amount_vnd'     => (string) $this->amount_vnd,
            'tax_amount'     => (string) $this->tax_amount,
            'total_amount'   => (string) $this->total_amount,
            'status'         => $this->status,
            'sent_at'        => $this->sent_at?->toIso8601String(),
            'paid_at'        => $this->paid_at?->toIso8601String(),
            'paid_amount'    => $this->paid_amount !== null ? (string) $this->paid_amount : null,
            'payment_method' => $this->payment_method,
            'payment_note'   => $this->when($isAdmin, $this->payment_note),
            'note'           => $this->note,
            'pdf_path'       => $this->when($isAdmin, $this->pdf_path),
            'items'          => InvoiceItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
