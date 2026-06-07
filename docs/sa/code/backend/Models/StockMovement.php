<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    public $timestamps = false;

    protected $table = 'stock_movements';

    // movement_type constants
    const TYPE_IN     = 'IN';
    const TYPE_OUT    = 'OUT';
    const TYPE_ADJUST = 'ADJUST';

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'movement_type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'reference_type',   // 'order' | 'inventory_check' | 'manual'
        'reference_id',
        'note',
        'created',
        'created_user_id',
    ];

    protected $casts = [
        'quantity'        => 'integer',
        'quantity_before' => 'integer',
        'quantity_after'  => 'integer',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
