<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BatchOrderItem extends Model
{
    public $timestamps = false;

    protected $table = 'batch_order_items';

    protected $fillable = [
        'shipment_batch_id',
        'order_id',
        'created',
    ];

    protected function casts(): array
    {
        return [
            'created' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ShipmentBatch::class, 'shipment_batch_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
