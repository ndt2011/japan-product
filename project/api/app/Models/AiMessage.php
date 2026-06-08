<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 4
 */
class AiMessage extends Model
{
    public $timestamps = false;

    protected $table = 'ai_messages';

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'intent',
        'tool_calls',
        'tool_results',
        'tokens_used',
        'created',
    ];

    protected function casts(): array
    {
        return [
            'tool_calls'   => 'array',
            'tool_results' => 'array',
            'created'      => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model) {
            $model->created = now();
        });
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }
}
