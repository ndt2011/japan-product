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
        'product_name_jp',
        'product_name_vi',
        'product_sku',
        'quantity',
        'cost_price_jpy',
        'selling_price_jpy',
        'unit_price_vnd',
        'fee_amount_vnd',
        'line_total_vnd',
    ];

    protected function casts(): array
    {
        return [
            'quantity'          => 'integer',
            'cost_price_jpy'    => 'decimal:2',
            'selling_price_jpy' => 'decimal:2',
            'unit_price_vnd'    => 'decimal:0',
            'fee_amount_vnd'    => 'decimal:0',
            'line_total_vnd'    => 'decimal:0',
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
