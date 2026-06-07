<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierJp extends Model
{
    public $timestamps = false;

    protected $table = 'suppliers_jp';

    protected $guarded = [];

    protected $casts = [
        'disabled_flag' => 'boolean',
        'deleted_flag' => 'boolean',
    ];
}
