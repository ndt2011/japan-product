<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QueryExpansionService
{
    private string $model = 'gpt-4o-mini';

    /**
     * Mở rộng query tiếng Việt → multilingual trước khi embedding.
     *
     * Ví dụ:
     *   Input:  "máy pha cà phê nhật"
     *   Output: "コーヒーメーカー 日本製 coffee maker Japan 캡슐 커피 머신 máy pha cà phê nhật bản"
     *
     * Cache 1 giờ để tiết kiệm API call.
     */
    public function expand(string $query): string
    {
        $cacheKey = 'query_expand_' . md5($query);

        return Cache::remember($cacheKey, 3600, function () use ($query) {
            return $this->callGpt($query);
        });
    }

    private function callGpt(string $query): string
    {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            Log::warning('QueryExpansionService: OpenAI key not configured, using original query');
            return $query;
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(10)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'       => $this->model,
                    'max_tokens'  => 200,
                    'temperature' => 0.3,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => <<<PROMPT
                            Bạn là công cụ mở rộng từ khóa tìm kiếm cho hệ thống hàng hóa Nhật Bản.
                            Nhiệm vụ: Dịch và mở rộng query sang tiếng Nhật, tiếng Anh, và giữ nguyên tiếng Việt.
                            Chỉ trả về các từ khóa, KHÔNG giải thích. Tối đa 30 từ.
                            Format: các từ khóa cách nhau bằng dấu cách.
                            PROMPT,
                        ],
                        [
                            'role'    => 'user',
                            'content' => "Query: {$query}",
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $expanded = trim($response->json('choices.0.message.content', $query));
                // Luôn giữ query gốc
                return $query . ' ' . $expanded;
            }

            Log::warning('QueryExpansionService: GPT call failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('QueryExpansionService exception: ' . $e->getMessage());
        }

        // Fallback: trả về query gốc
        return $query;
    }
}

// ─── Sử dụng trong AIProductSearchController ────────────────────────────────
// Inject QueryExpansionService vào controller hiện tại:
//
// public function __construct(
//     private readonly QueryExpansionService $queryExpansion
// ) {}
//
// Trong method search():
// $expandedQuery  = $this->queryExpansion->expand($request->query);
// $embedding      = $this->getEmbedding($expandedQuery);  // OpenAI embedding
// $semanticResults = $this->semanticSearch($embedding);   // cosine similarity
// $keywordResults  = $this->keywordSearch($request->query); // MySQL FULLTEXT
// $merged          = $this->mergeResults($semanticResults, $keywordResults);
//
// Hybrid score: 0.7 × semantic_score + 0.3 × keyword_score
