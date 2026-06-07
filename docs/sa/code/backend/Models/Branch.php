<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'created',
        'created_user_id',
        'modified',
        'modified_user_id',
        'deleted_flag',
    ];

    protected $casts = [
        'deleted_flag' => 'boolean',
    ];

    // ─── Scopes ─────────────────────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('deleted_flag', 0);
    }

    public function scopeByRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    // ─── Relationships ──────────────────────────────────────────────────────
    public function users()
    {
        return $this->hasMany(BranchUser::class, 'branch_id');
    }

    public function manager()
    {
        return $this->hasOne(BranchUser::class, 'branch_id')
            ->where('role', 'manager')
            ->where('deleted_flag', 0);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'branch_id');
    }
}
