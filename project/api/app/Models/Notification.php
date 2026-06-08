<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public $timestamps = false;

    protected $table = 'notifications';

    protected $fillable = [
        'user_type',
        'user_id',
        'type',
        'title',
        'body',
        'data_type',
        'data_id',
        'is_read',
        'created',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'created' => 'datetime',
        ];
    }
}
