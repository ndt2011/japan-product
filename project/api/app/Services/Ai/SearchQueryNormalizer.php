<?php

namespace App\Services\Ai;

/**
 * Tách ý định tìm sản phẩm từ câu chat tự nhiên.
 * VD: "tìm cho tôi mỹ phẩm tốt" → "mỹ phẩm tốt"
 */
class SearchQueryNormalizer
{
    /** @var list<string> */
    private const PREFIX_PATTERNS = [
        '/^(?:xin\s+)?(?:tìm|tim|kiếm|kiem|search)\s+(?:cho\s+)?(?:tôi|toi|mình|minh|em)\s+/u',
        '/^(?:giúp|giup)\s+(?:tôi|toi|mình|minh|em)\s+(?:tìm|tim|kiếm|kiem)\s+/u',
        '/^(?:cho|giúp|giup)\s+(?:tôi|toi|mình|minh|em)\s+(?:xem|tìm|tim)\s+/u',
        '/^(?:tìm|tim|kiếm|kiem)\s+(?:giúp|giup)\s+/u',
        '/^(?:tìm|tim|kiếm|kiem)\s+/u',
        '/^(?:gợi ý|goi y|đề xuất|de xuat)\s+(?:cho\s+)?(?:tôi|toi)?\s*/u',
    ];

    /** @var list<string> */
    private const SUFFIX_PATTERNS = [
        '/\s+(?:giúp|giup)\s+(?:tôi|toi|mình|minh|em)(?:\s+với|\s+nhé|\s+nhe)?$/u',
        '/\s+(?:được không|duoc khong|nhé|nhe|ạ|a|please)$/u',
        '/\s+(?:trên\s+)?rakuten$/u',
    ];

    public function extract(string $message): string
    {
        $query = trim($message);

        if ($query === '') {
            return $query;
        }

        $normalized = mb_strtolower($query);

        foreach (self::PREFIX_PATTERNS as $pattern) {
            $normalized = preg_replace($pattern, '', $normalized) ?? $normalized;
        }

        foreach (self::SUFFIX_PATTERNS as $pattern) {
            $normalized = preg_replace($pattern, '', $normalized) ?? $normalized;
        }

        $normalized = trim(preg_replace('/\s+/u', ' ', $normalized) ?? $normalized);

        return $normalized !== '' ? $normalized : $query;
    }
}
