<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    public $timestamps = false;

    protected $table = 'warehouses';

    protected $fillable = [
        'warehouse_cd',
        'warehouse_name',
        'address',
        'country',
        'manager_name',
        'tel',
        'disabled_flag',
        'created',
        'deleted_flag',
    ];

    protected function casts(): array
    {
        return [
            'disabled_flag' => 'boolean',
            'deleted_flag' => 'boolean',
            'created' => 'datetime',
        ];
    }
}
