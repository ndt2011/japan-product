<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    public $timestamps = false;

    protected $table = 'product_categories';

    protected $guarded = [];

    protected $casts = [
        'disabled_flag' => 'boolean',
        'deleted_flag' => 'boolean',
    ];
}
