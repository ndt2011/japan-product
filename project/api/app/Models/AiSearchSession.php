<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiSearchSession extends Model
{
    public $timestamps = false;

    protected $table = 'ai_search_sessions';

    protected $fillable = [
        'keyword',
        'keyword_jp',
        'status',
        'user_type',
        'user_id',
        'results_json',
        'error_message',
        'created',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'results_json' => 'array',
            'created' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(AiProductCandidate::class, 'ai_search_session_id');
    }

    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }
}
