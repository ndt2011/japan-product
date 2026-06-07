<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    public $timestamps = false;

    protected $table = 'inventories';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'quantity',
        'reserved_qty',
        'actual_qty',
        'last_check_date',
        'memo',
        'created',
        'created_user_id',
        'modified',
        'modified_user_id',
        'deleted',
        'deleted_flag',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'reserved_qty' => 'integer',
            'actual_qty' => 'integer',
            'deleted_flag' => 'boolean',
            'last_check_date' => 'date',
            'created' => 'datetime',
            'modified' => 'datetime',
            'deleted' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function availableQty(): int
    {
        return max(0, (int) $this->quantity - (int) $this->reserved_qty);
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
