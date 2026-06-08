<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 4
 */
class AiConversation extends Model
{
    public $timestamps = false;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'session_id',
        'user_type',
        'user_id',
        'title',
        'created',
        'modified',
    ];

    protected function casts(): array
    {
        return [
            'created'  => 'datetime',
            'modified' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            if (empty($model->session_id)) {
                $model->session_id = (string) Str::uuid();
            }
            $model->created  = now();
            $model->modified = now();
        });

        static::updating(function (self $model) {
            $model->modified = now();
        });
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class, 'conversation_id')->orderBy('created');
    }
}
