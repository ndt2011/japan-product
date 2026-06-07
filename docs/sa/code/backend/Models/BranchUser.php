<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class BranchUser extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'branch_users';

    protected $fillable = [
        'branch_id',
        'login_id',
        'password',
        'full_name',
        'role',   // 'manager' | 'staff'
        'deleted_flag',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'deleted_flag' => 'boolean',
    ];

    // ─── Accessor dùng cho RoleMiddleware ───────────────────────────────────
    // Returns: 'branch_manager' hoặc 'branch_staff'
    public function getUserTypeAttribute(): string
    {
        return 'branch_' . $this->role;
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('deleted_flag', 0);
    }

    // ─── Relationships ──────────────────────────────────────────────────────
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'branch_id', 'branch_id');
    }
}
