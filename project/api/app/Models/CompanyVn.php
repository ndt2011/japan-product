<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class CompanyVn extends Authenticatable
{
    use HasApiTokens, HasFactory;

    public $timestamps = false;

    protected $table = 'companies_vn';

    protected $fillable = [
        'company_cd',
        'login_id',
        'password',
        'company_name',
        'address',
        'province',
        'tel',
        'fax',
        'email',
        'tax_code',
        'contact_name',
        'memo',
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

    public function isActive(): bool
    {
        return ! $this->disabled_flag && ! $this->deleted_flag;
    }
}
