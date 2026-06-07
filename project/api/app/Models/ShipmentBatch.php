<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShipmentBatch extends Model
{
    public $timestamps = false;

    protected $table = 'shipment_batches';

    protected $fillable = [
        'batch_no',
        'batch_name',
        'status',
        'logistics_partner',
        'tracking_number',
        'estimated_departure_date',
        'created_admin_id',
        'created',
        'modified',
        'deleted_flag',
    ];

    protected function casts(): array
    {
        return [
            'estimated_departure_date' => 'date',
            'deleted_flag' => 'boolean',
            'created' => 'datetime',
            'modified' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_admin_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BatchOrderItem::class, 'shipment_batch_id');
    }

    public function orders()
    {
        return $this->hasManyThrough(
            Order::class,
            BatchOrderItem::class,
            'shipment_batch_id',
            'id',
            'id',
            'order_id',
        );
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
