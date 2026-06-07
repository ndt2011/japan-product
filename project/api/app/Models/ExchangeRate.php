<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    public $timestamps = false;

    protected $table = 'exchange_rates';

    protected $guarded = [];

    protected $casts = [
        'rate' => 'decimal:4',
        'apply_date' => 'date',
    ];
}
