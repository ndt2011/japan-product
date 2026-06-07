<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    public $timestamps = false;

    protected $table = 'branches';

    protected $fillable = [
        'branch_cd',
        'branch_name',
        'region',
        'province',
        'address',
        'tel',
        'disabled_flag',
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
            'disabled_flag' => 'boolean',
            'deleted_flag' => 'boolean',
            'created' => 'datetime',
            'modified' => 'datetime',
            'deleted' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(BranchUser::class, 'branch_id')
            ->where('deleted_flag', false);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'branch_id');
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
