<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QueryExpansionService
{
    public function expand(string $query): string
    {
        $query = trim($query);

        if ($query === '' || ! config('services.openai.api_key')) {
            return $query;
        }

        $cacheKey = 'query_expansion_'.md5(mb_strtolower($query));

        return Cache::remember($cacheKey, 3600, function () use ($query) {
            try {
                $response = Http::withToken(config('services.openai.api_key'))
                    ->timeout(25)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => config('services.openai.model', 'gpt-4o-mini'),
                        'temperature' => 0.3,
                        'max_tokens' => 200,
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => 'Bạn là chuyên gia sản phẩm Nhật Bản nhập khẩu Việt Nam. '
                                    .'Mở rộng từ khóa tìm kiếm thành chuỗi đa ngôn ngữ (Việt + Anh + Nhật). '
                                    .'Chỉ trả chuỗi từ khóa, không JSON, không giải thích. Tối đa 30 từ, cách nhau bởi dấu phẩy.',
                            ],
                            [
                                'role' => 'user',
                                'content' => "Mở rộng từ khóa: \"{$query}\"",
                            ],
                        ],
                    ]);

                if (! $response->successful()) {
                    Log::warning('Query expansion HTTP failed', ['status' => $response->status()]);

                    return $query;
                }

                $expanded = trim((string) $response->json('choices.0.message.content'));

                return $expanded !== '' ? $expanded : $query;
            } catch (\Throwable $e) {
                Log::warning('Query expansion failed', ['error' => $e->getMessage()]);

                return $query;
            }
        });
    }
}
