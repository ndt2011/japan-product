<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    public $timestamps = false;

    protected $table = 'invoices';

    protected $fillable = [
        'order_id',
        'company_vn_id',
        'branch_id',
        'invoice_no',
        'invoice_date',
        'due_date',
        'locked_rate',
        'fee_rate',
        'amount_vnd',
        'subtotal_vnd',
        'fee_amount_vnd',
        'tax_amount',
        'total_amount',
        'status',
        'sent_at',
        'paid_at',
        'paid_amount',
        'payment_method',
        'payment_note',
        'note',
        'pdf_path',
        'created',
        'created_user_id',
        'modified',
        'modified_user_id',
        'deleted_flag',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date'   => 'date',
            'due_date'       => 'date',
            'locked_rate'    => 'decimal:4',
            'fee_rate'       => 'decimal:4',
            'amount_vnd'     => 'decimal:0',
            'subtotal_vnd'   => 'decimal:0',
            'fee_amount_vnd' => 'decimal:0',
            'tax_amount'     => 'decimal:0',
            'total_amount'   => 'decimal:0',
            'paid_amount'    => 'decimal:0',
            'sent_at'        => 'datetime',
            'paid_at'        => 'datetime',
            'deleted_flag'   => 'boolean',
            'created'        => 'datetime',
            'modified'       => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(CompanyVn::class, 'company_vn_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id');
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
