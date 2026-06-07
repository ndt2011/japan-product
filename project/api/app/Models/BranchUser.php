<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class BranchUser extends Authenticatable
{
    use HasApiTokens;

    public $timestamps = false;

    protected $table = 'branch_users';

    protected $fillable = [
        'branch_id',
        'login_id',
        'password',
        'full_name',
        'email',
        'role',
        'disabled_flag',
        'created',
        'created_user_id',
        'modified',
        'modified_user_id',
        'deleted',
        'deleted_flag',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'disabled_flag' => 'boolean',
            'deleted_flag' => 'boolean',
            'created' => 'datetime',
            'modified' => 'datetime',
            'deleted' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getUserTypeAttribute(): string
    {
        return 'branch_'.$this->role;
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'branch_id', 'branch_id');
    }

    public function isActive(): bool
    {
        return ! $this->disabled_flag && ! $this->deleted_flag;
    }
}
