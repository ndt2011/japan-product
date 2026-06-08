<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'products';

    protected $fillable = [
        'product_category_id',
        'product_cd',
        'product_name',
        'product_name_jp',
        'name_vi',
        'spec',
        'unit',
        'cost_jpy',
        'cost_price_jpy',
        'selling_price_jpy',
        'fee_rate',
        'price_vnd',
        'retail_price_vnd',
        'barcode',
        'min_order_qty',
        'supplier_id',
        'origin',
        'import_tax_rate',
        'description',
        'description_vi',
        'image_path',
        'memo',
        'embedding',
        'embedding_updated_at',
        'disabled_flag',
        'created',
        'created_user_id',
        'modified',
        'modified_user_id',
        'deleted',
        'deleted_flag',
    ];

    protected $hidden = [
        'embedding',
    ];

    protected function casts(): array
    {
        return [
            'cost_jpy' => 'integer',
            'cost_price_jpy' => 'decimal:2',
            'selling_price_jpy' => 'decimal:2',
            'fee_rate' => 'decimal:4',
            'price_vnd' => 'integer',
            'import_tax_rate' => 'decimal:2',
            'embedding' => 'array',
            'embedding_updated_at' => 'datetime',
            'disabled_flag' => 'boolean',
            'deleted_flag' => 'boolean',
            'created' => 'datetime',
            'modified' => 'datetime',
            'deleted' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(SupplierJp::class, 'supplier_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id')
            ->where('deleted_flag', false)
            ->orderBy('order_no')
            ->orderBy('id');
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class, 'product_id');
    }

    public function orderDetails(): HasMany
    {
        return $this->hasMany(OrderDetail::class, 'product_id');
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
