<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchasingSession extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_type',
        'user_id',
        'query',
        'keyword_jp',
        'budget_jpy',
        'qty',
        'status',
        'response_json',
        'created',
    ];

    protected function casts(): array
    {
        return [
            'response_json' => 'array',
            'created' => 'datetime',
        ];
    }
}
