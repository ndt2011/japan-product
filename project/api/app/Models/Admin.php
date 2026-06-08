<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory;

    public $timestamps = false;

    protected $table = 'admins';

    protected $fillable = [
        'login_id',
        'password',
        'full_name',
        'email',
        'phone',
        'avatar_url',
        'branch_id',
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
