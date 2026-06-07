<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'admins';

    protected $fillable = [
        'login_id',
        'password',
        'full_name',
        'email',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'deleted_flag' => 'boolean',
    ];

    // ─── Accessor dùng cho RoleMiddleware ───────────────────────────────────
    public function getUserTypeAttribute(): string
    {
        return 'admin';
    }

    // ─── Relationships ──────────────────────────────────────────────────────
    public function orders()
    {
        return $this->hasMany(Order::class, 'handler_admin_id');
    }
}
