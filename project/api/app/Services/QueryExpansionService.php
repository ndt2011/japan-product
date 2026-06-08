<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QueryExpansionService
{
    /**
     * Mở rộng query tiếng Việt → đa ngôn ngữ trước khi embedding.
     * Spec: docs/sa/code/backend/Services/QueryExpansionService.php
     *
     * Ví dụ:
     *   Input:  "máy pha cà phê nhật"
     *   Output: "máy pha cà phê nhật コーヒーメーカー coffee maker Japan capsule"
     */
    public function expand(string $query): string
    {
        $query = trim($query);

        if ($query === '' || ! config('services.openai.api_key')) {
            return $query;
        }

        $cacheKey = 'query_expand_'.md5(mb_strtolower($query));

        return Cache::remember($cacheKey, 3600, function () use ($query) {
            $expanded = $this->callGpt($query);

            if ($expanded === '' || $expanded === $query) {
                return $query;
            }

            // Luôn giữ query gốc — giúp keyword search vẫn khớp từ user gõ
            return $query.' '.$expanded;
        });
    }

    private function callGpt(string $query): string
    {
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
                            'content' => <<<'PROMPT'
Bạn là công cụ mở rộng từ khóa tìm kiếm cho hệ thống hàng hóa Nhật Bản nhập khẩu Việt Nam.
Nhiệm vụ: Dịch và mở rộng query sang tiếng Nhật, tiếng Anh, và giữ nguyên tiếng Việt.
Chỉ trả về các từ khóa, KHÔNG giải thích, KHÔNG JSON, KHÔNG markdown. Tối đa 30 từ.
Format: các từ khóa cách nhau bằng dấu cách.

Ví dụ dạy (few-shot):
- Query: thuốc bổ gan nhật → thuốc bổ gan nhật bản liver supplement Japan 肝臓サプリ silymarin ornithine detox gan
- Query: vitamin c nhật bản → vitamin c nhật bản ビタミンC ascorbic supplement DHC Fancl immune
- Query: máy pha cà phê nhật → コーヒーメーカー coffee maker Japan capsule máy pha cà phê nhật bản
- Query: collagen → collagen コラーゲン supplement beauty skin nhật bản peptide
PROMPT,
                        ],
                        [
                            'role' => 'user',
                            'content' => "Query: {$query}",
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
    }
}
