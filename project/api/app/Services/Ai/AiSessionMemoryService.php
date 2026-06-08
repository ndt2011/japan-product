<?php

namespace App\Services\Ai;

/**
 * Bộ nhớ phiên — nhớ sở thích khách trong 1 conversation.
 *
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 11.1
 */
class AiSessionMemoryService
{
    /** @var list<string> */
    private const INTEREST_PATTERNS = [
        'mỹ phẩm', 'my pham', 'cosmetic', 'skincare', 'son môi', 'kem dưỡng',
        'vitamin', 'collagen', 'omega', 'glucosamine', 'bổ gan', 'bổ khớp', 'tpbvsk',
        'thực phẩm chức năng', 'supplement', 'tã', 'sữa bột', 'gia dụng',
        'máy lọc', 'nồi cơm', 'matcha', 'trà nhật', 'kẹo nhật',
    ];

    /** @var list<string> */
    private const BRAND_PATTERNS = [
        'dhc', 'fancl', 'shiseido', 'sk-ii', 'skii', 'orihiro', 'kobayashi',
        'rohto', 'kose', 'curel', 'biore', 'pigeon', 'merries', 'panasonic',
    ];

    /** @var list<string> */
    private const VAGUE_MORE_PATTERNS = [
        'gợi ý thêm', 'goi y them', 'còn gì', 'con gi', 'khác nữa', 'khac nua',
        'xem thêm', 'tìm thêm', 'tìm tiếp', 'nữa đi', 'nua di',
    ];

    /** @var list<string> */
    private const VAGUE_SAME_PATTERNS = [
        'tương tự', 'tuong tu', 'giống vậy', 'giong vay', 'loại đó', 'loai do',
        'món đó', 'mon do', 'sản phẩm đó', 'san pham do', 'cái đó', 'cai do',
    ];

    /**
     * Bổ sung ngữ cảnh phiên khi khách nói mơ hồ.
     *
     * @param  array<string, mixed>  $context
     */
    public function resolveMessageWithContext(string $message, array $context): string
    {
        $lower = mb_strtolower(trim($message));

        if ($lower === '') {
            return $message;
        }

        foreach (self::VAGUE_SAME_PATTERNS as $pattern) {
            if (str_contains($lower, $pattern)) {
                $lastQuery = (string) ($context['last_search_query'] ?? '');
                if ($lastQuery !== '') {
                    return $lastQuery.' tương tự';
                }
                $lastName = (string) (($context['last_product_names'][0] ?? '') ?: '');
                if ($lastName !== '') {
                    return 'tìm sản phẩm tương tự '.$lastName;
                }
            }
        }

        foreach (self::VAGUE_MORE_PATTERNS as $pattern) {
            if (str_contains($lower, $pattern)) {
                $interests = (array) ($context['interests'] ?? []);
                if ($interests !== []) {
                    return 'gợi ý '.implode(' ', array_slice($interests, 0, 2));
                }
                $lastQuery = (string) ($context['last_search_query'] ?? '');
                if ($lastQuery !== '') {
                    return $lastQuery;
                }
            }
        }

        return $message;
    }

    /**
     * @param  array<string, mixed>  $context
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function updateFromTurn(
        array $context,
        string $message,
        string $intent,
        array $data,
    ): array {
        $context['interests'] = array_values(array_unique(array_merge(
            (array) ($context['interests'] ?? []),
            $this->extractInterests($message),
        )));

        $context['brands'] = array_values(array_unique(array_merge(
            (array) ($context['brands'] ?? []),
            $this->extractBrands($message),
        )));

        if ($budget = $this->extractBudgetHint($message)) {
            $context['budget_hint'] = $budget;
        }

        if ($qty = $this->extractQuantityHint($message)) {
            $context['quantity_hint'] = $qty;
        }

        $searchIntents = [
            IntentClassifier::INTERNAL_SEARCH,
            IntentClassifier::RAKUTEN_DISCOVER,
        ];

        if (in_array($intent, $searchIntents, true)) {
            $searchQuery = (string) ($data['search_query'] ?? '');
            if ($searchQuery !== '') {
                $context['last_search_query'] = $searchQuery;
                $context['interests'] = array_values(array_unique(array_merge(
                    (array) $context['interests'],
                    $this->extractInterests($searchQuery),
                )));
            }

            $products = (array) ($data['products'] ?? []);
            if ($products !== []) {
                $context['last_product_ids'] = array_slice(
                    array_map(fn ($p) => (int) ($p['id'] ?? 0), $products),
                    0,
                    5,
                );
                $context['last_product_names'] = array_slice(
                    array_filter(array_map(
                        fn ($p) => (string) (($p['name_vi'] ?? '') ?: ($p['product_name'] ?? '')),
                        $products,
                    )),
                    0,
                    5,
                );
            }
        }

        $context['updated_at'] = now()->toIso8601String();

        return $context;
    }

    /** @param  array<string, mixed>  $context */
    public function buildContextSummary(array $context): string
    {
        $parts = [];

        $interests = (array) ($context['interests'] ?? []);
        if ($interests !== []) {
            $parts[] = 'Sở thích phiên: '.implode(', ', array_slice($interests, 0, 5));
        }

        $brands = (array) ($context['brands'] ?? []);
        if ($brands !== []) {
            $parts[] = 'Thương hiệu quan tâm: '.implode(', ', array_slice($brands, 0, 5));
        }

        if (! empty($context['last_search_query'])) {
            $parts[] = 'Lần tìm gần nhất: '.$context['last_search_query'];
        }

        $lastNames = (array) ($context['last_product_names'] ?? []);
        if ($lastNames !== []) {
            $parts[] = 'SP vừa xem: '.implode(', ', array_slice($lastNames, 0, 3));
        }

        if (! empty($context['budget_hint'])) {
            $parts[] = 'Ngân sách gợi ý: '.$context['budget_hint'];
        }

        if (! empty($context['quantity_hint'])) {
            $parts[] = 'Số lượng gợi ý: '.$context['quantity_hint'];
        }

        return implode("\n", $parts);
    }

    /** @return list<string> */
    private function extractInterests(string $text): array
    {
        $lower = mb_strtolower($text);
        $found = [];

        foreach (self::INTEREST_PATTERNS as $pattern) {
            if (str_contains($lower, $pattern)) {
                $found[] = $pattern;
            }
        }

        return $found;
    }

    /** @return list<string> */
    private function extractBrands(string $text): array
    {
        $lower = mb_strtolower($text);
        $found = [];

        foreach (self::BRAND_PATTERNS as $brand) {
            if (str_contains($lower, $brand)) {
                $found[] = match ($brand) {
                    'sk-ii', 'skii' => 'SK-II',
                    default => strtoupper($brand),
                };
            }
        }

        return $found;
    }

    private function extractBudgetHint(string $text): ?string
    {
        if (preg_match('/(?:dưới|duoi|khoảng|khoang|tầm|tam|max)\s*(\d+)\s*(triệu|trieu|tr|k|nghìn|nghin)/ui', $text, $m)) {
            return trim($m[0]);
        }

        return null;
    }

    private function extractQuantityHint(string $text): ?string
    {
        if (preg_match('/(\d+)\s*(hộp|hop|chai|lọ|lo|thùng|thung|lô|lo)/ui', $text, $m)) {
            return trim($m[0]);
        }

        return null;
    }
}
