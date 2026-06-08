<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public $timestamps = false;

    protected $table = 'orders';

    protected $fillable = [
        'company_vn_id',
        'branch_id',
        'order_no',
        'status',
        'order_date',
        'expected_date',
        'total_jpy',
        'total_vnd',
        'exchange_rate',
        'shipping_fee',
        'import_tax',
        'biko',
        'handler_admin_id',
        'delivered_admin_at',
        'delivered_client_at',
        'completed_at',
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
            'order_date' => 'date',
            'expected_date' => 'date',
            'exchange_rate' => 'decimal:2',
            'deleted_flag' => 'boolean',
            'delivered_admin_at' => 'datetime',
            'delivered_client_at' => 'datetime',
            'completed_at' => 'datetime',
            'created' => 'datetime',
            'modified' => 'datetime',
            'deleted' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(CompanyVn::class, 'company_vn_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'handler_admin_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(OrderDetail::class, 'order_id')
            ->where('deleted_flag', false);
    }

    public function costs(): HasMany
    {
        return $this->hasMany(OrderCost::class, 'order_id');
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
