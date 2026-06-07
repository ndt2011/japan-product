<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    public $timestamps = false;

    protected $table = 'invoice_items';

    protected $fillable = [
        'invoice_id',
        'order_detail_id',
        'product_name',
        'quantity',
        'unit_price_vnd',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price_vnd' => 'decimal:0',
            'amount' => 'decimal:0',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function orderDetail(): BelongsTo
    {
        return $this->belongsTo(OrderDetail::class, 'order_detail_id');
    }
}
