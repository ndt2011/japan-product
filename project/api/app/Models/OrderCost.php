<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Chi phí thực tế Admin nhập để tính net_profit
 * spec: docs/sa/amendments/invoice-payment.md § 3.5
 */
class OrderCost extends Model
{
    public $timestamps = false;

    protected $table = 'order_costs';

    protected $fillable = [
        'order_id',
        'batch_id',
        'cost_type',
        'amount_vnd',
        'note',
        'created',
        'created_user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount_vnd' => 'decimal:0',
            'created'    => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
