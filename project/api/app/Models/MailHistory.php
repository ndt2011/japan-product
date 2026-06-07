<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailHistory extends Model
{
    public $timestamps = false;

    protected $table = 'mail_histories';

    protected $fillable = [
        'mail_template_id',
        'to_address',
        'cc_address',
        'subject',
        'body',
        'send_status',
        'sent_at',
        'error_message',
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
            'send_status' => 'boolean',
            'sent_at' => 'datetime',
            'created' => 'datetime',
            'modified' => 'datetime',
            'deleted' => 'datetime',
            'deleted_flag' => 'boolean',
        ];
    }
}
