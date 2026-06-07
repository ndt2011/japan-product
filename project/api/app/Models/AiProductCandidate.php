<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiProductCandidate extends Model
{
    public $timestamps = false;

    protected $table = 'ai_product_candidates';

    protected $fillable = [
        'ai_search_session_id',
        'product_name_jp',
        'product_name_vn',
        'image_url',
        'price_jpy',
        'source_url',
        'source_platform',
        'description',
        'status',
        'reject_reason',
        'product_id',
        'created_user_type',
        'created_user_id',
        'reviewed_user_type',
        'reviewed_user_id',
        'created',
        'modified',
        'deleted_flag',
    ];

    protected function casts(): array
    {
        return [
            'price_jpy' => 'integer',
            'deleted_flag' => 'boolean',
            'created' => 'datetime',
            'modified' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AiSearchSession::class, 'ai_search_session_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function scopeActive($query)
    {
        return $query->where('deleted_flag', false);
    }
}
