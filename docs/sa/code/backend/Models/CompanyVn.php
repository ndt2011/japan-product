<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class CompanyVn extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'companies_vn';

    protected $fillable = [
        'login_id',
        'password',
        'company_name',
        'contact_name',
        'email',
        'phone',
        'address',
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
        return 'company_vn';
    }

    // ─── Relationships ──────────────────────────────────────────────────────
    public function orders()
    {
        return $this->hasMany(Order::class, 'company_vn_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'company_vn_id');
    }
}
