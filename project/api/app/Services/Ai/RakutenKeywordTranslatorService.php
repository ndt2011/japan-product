<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Dịch từ khóa tìm kiếm (tiếng Việt / tiếng Anh) sang tiếng Nhật
 * để truyền vào Rakuten Ichiba API.
 *
 * Luồng:
 *   "dhc"          → brand map → "DHC"
 *   "mỹ phẩm tốt" → GPT       → "コスメ スキンケア おすすめ"
 *   "コラーゲン"   → already JP → nguyên gốc (không gọi GPT)
 *
 * spec: docs/sa/amendments/ai-purchasing-specialist.md §9
 */
class RakutenKeywordTranslatorService
{
    public function __construct(
        private readonly ?AiTeachingCatalogService $teachingCatalog = null,
    ) {}

    /**
     * Map thương hiệu nổi tiếng → tên tìm kiếm Rakuten tối ưu.
     * Key = lowercase (không dấu, không khoảng trắng thừa).
     */
    private const BRAND_MAP = [
        // Thực phẩm chức năng
        'dhc'          => 'DHC',
        'fancl'        => 'FANCL ファンケル',
        'orihiro'      => 'オリヒロ',
        'suntory'      => 'サントリー',
        'meiji'        => '明治',
        'asahi'        => 'アサヒ',
        'taisho'       => '大正製薬',
        'kobayashi'    => '小林製薬',
        'rohto'        => 'ロート製薬',
        'eisai'        => 'エーザイ',
        'morishita'    => '森下仁丹',
        // Mỹ phẩm
        'shiseido'     => '資生堂',
        'sk2'          => 'SK-II',
        'skii'         => 'SK-II',
        'sk-ii'        => 'SK-II',
        'kose'         => 'コーセー',
        'kanebo'       => 'カネボウ',
        'decorte'      => 'コスデコルテ',
        'hada labo'    => 'ハダラボ',
        'hadalabo'     => 'ハダラボ',
        'curel'        => 'キュレル',
        'biore'        => 'ビオレ',
        'kao'          => '花王',
        'lion'         => 'ライオン',
        // Điện tử
        'panasonic'    => 'パナソニック',
        'sharp'        => 'シャープ',
        'sony'         => 'ソニー',
        'toshiba'      => '東芝',
        'hitachi'      => '日立',
        'daikin'       => 'ダイキン',
        'fujitsu'      => '富士通',
        'iris'         => 'アイリスオーヤマ',
        'irisohyama'   => 'アイリスオーヤマ',
        'omron'        => 'オムロン',
        // Thực phẩm
        'calbee'       => 'カルビー',
        'glico'        => 'グリコ',
        'morinaga'     => '森永',
        'lotte'        => 'ロッテ',
        // Trẻ em
        'pigeon'       => 'ピジョン',
        'merries'      => 'メリーズ',
        'pampers'      => 'パンパース',
        'goo.n'        => 'グーン',
        'goon'         => 'グーン',
    ];

    /**
     * Map từ khóa VI → JP thường gặp (hardcode, không cần GPT).
     * Dùng khi OpenAI không có key hoặc để cache tĩnh.
     */
    private const VI_TO_JP_MAP = [
        'mỹ phẩm'              => 'コスメ スキンケア',
        'mỹ phẩm nhật'         => 'コスメ スキンケア 日本',
        'mỹ phẩm tốt'          => 'コスメ スキンケア おすすめ',
        'son môi'               => 'リップ 口紅',
        'kem dưỡng da'          => '保湿クリーム スキンケア',
        'kem chống nắng'        => '日焼け止め UVケア',
        'serum'                 => 'セラム 美容液',
        'toner'                 => '化粧水 トナー',
        'sữa rửa mặt'           => '洗顔フォーム',
        'collagen'              => 'コラーゲン サプリ',
        'vitamin c'             => 'ビタミンC サプリメント',
        'vitamin c nhật'        => 'ビタミンC サプリメント',
        'omega 3'               => 'オメガ3 DHA EPA',
        'omega3'                => 'オメガ3 DHA EPA',
        'glucosamine'           => 'グルコサミン コンドロイチン',
        'bổ khớp'               => 'グルコサミン コンドロイチン 関節',
        'bổ gan'                => '肝臓サポート オルニチン',
        'bổ não'                => 'DHA 脳サプリ',
        'tpbvsk'                => 'サプリメント 健康食品',
        'thực phẩm chức năng'   => 'サプリメント 健康食品',
        'thuốc bổ'              => 'サプリメント 栄養補助',
        'tã giấy'               => 'おむつ',
        'sữa bột'               => '粉ミルク',
        'sữa trẻ em'            => '粉ミルク ベビーフード',
        'máy lọc không khí'     => '空気清浄機',
        'máy lọc nước'          => '浄水器 整水器',
        'nồi cơm điện'          => '炊飯器',
        'máy massage'           => 'マッサージ器',
        'máy đo huyết áp'       => '血圧計',
        'nhiệt kế'              => '体温計',
        'băng vệ sinh'          => '生理用品 ナプキン',
        'đồ gia dụng nhật'      => '生活家電 日本',
        'thức ăn cho mèo'       => 'キャットフード',
        'thức ăn cho chó'       => 'ドッグフード',
        'kẹo nhật'              => 'お菓子 和菓子',
        'snack nhật'            => 'スナック お菓子',
        'trà nhật'              => '日本茶 緑茶',
        'matcha'                => '抹茶 マッチャ',
        'nước uống nhật'        => '飲料 ドリンク 日本',
    ];

    public function translate(string $keyword, ?int $branchId = null): string
    {
        $keyword = trim($keyword);

        if ($keyword === '') {
            return $keyword;
        }

        // 1. Already Japanese → no translation needed
        if ($this->containsJapanese($keyword)) {
            return $keyword;
        }

        $lower = mb_strtolower($keyword);
        $brandMap = $this->mergedBrandMap($branchId);
        $viToJpMap = $this->mergedViToJpMap($branchId);

        // 2. Brand name map (exact)
        if (isset($brandMap[$lower])) {
            return $brandMap[$lower];
        }

        // 3. Hardcoded VI→JP phrase map (exact match)
        if (isset($viToJpMap[$lower])) {
            return $viToJpMap[$lower];
        }

        // 4. Partial phrase match in VI map
        foreach ($viToJpMap as $viPhrase => $jpPhrase) {
            if (str_contains($lower, $viPhrase)) {
                return $jpPhrase;
            }
        }

        // 5. GPT translation (with 24h cache)
        if (config('services.openai.api_key')) {
            return $this->translateViaGpt($keyword);
        }

        // 6. Fallback: return original (let Rakuten try)
        return $keyword;
    }

    /**
     * Build Rakuten search keyword: original + translated (for maximum recall).
     * Rakuten handles mixed keywords poorly, so we prefer translated-only for JP API.
     */
    public function buildRakutenKeyword(string $keyword, ?int $branchId = null): string
    {
        $keyword = trim($keyword);

        if ($keyword === '') {
            return $keyword;
        }

        $lower = mb_strtolower($keyword);
        $brandMap = $this->mergedBrandMap($branchId);

        // Brand: map to Japanese brand name directly
        if (isset($brandMap[$lower])) {
            return $brandMap[$lower];
        }

        // Already Japanese: use as-is
        if ($this->containsJapanese($keyword)) {
            return $keyword;
        }

        // Translate to Japanese
        $translated = $this->translate($keyword, $branchId);

        // If translation succeeded (different from input), return only Japanese
        if ($translated !== $keyword) {
            return $translated;
        }

        // Fallback: return original (might be English brand like "Sony")
        return $keyword;
    }

    private function translateViaGpt(string $query): string
    {
        $cacheKey = 'rakuten_kw_jp_'.md5(mb_strtolower($query));

        return Cache::remember($cacheKey, 86400, function () use ($query) {
            try {
                $response = Http::withToken(config('services.openai.api_key'))
                    ->timeout(12)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model'       => 'gpt-4o-mini',
                        'temperature' => 0.1,
                        'max_tokens'  => 40,
                        'messages'    => [
                            [
                                'role'    => 'system',
                                'content' => <<<'PROMPT'
Translate the user's search query into Japanese keywords for Rakuten Japan marketplace search.
Return ONLY Japanese words (Kanji/Katakana/Hiragana), max 4 words, no explanation, no punctuation.
Examples:
- mỹ phẩm → コスメ スキンケア
- mỹ phẩm tốt → コスメ スキンケア おすすめ
- kem dưỡng da → 保湿クリーム スキンケア
- vitamin c → ビタミンC サプリ
- thuốc bổ gan → 肝臓サポート オルニチン
- tã giấy → おむつ
- máy lọc nước → 浄水器
- cosmetics → コスメ スキンケア
- supplement → サプリメント
PROMPT,
                            ],
                            ['role' => 'user', 'content' => $query],
                        ],
                    ]);

                $result = trim((string) ($response->json('choices.0.message.content') ?? ''));

                if ($result !== '' && $this->containsJapanese($result)) {
                    return $result;
                }

                return $query; // fallback if GPT returns non-Japanese
            } catch (\Throwable $e) {
                Log::warning('RakutenKeywordTranslator GPT failed', [
                    'query' => $query,
                    'error' => $e->getMessage(),
                ]);

                return $query;
            }
        });
    }

    private function containsJapanese(string $text): bool
    {
        // Hiragana, Katakana, or CJK Unified Ideographs
        return (bool) preg_match('/[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FFF}]/u', $text);
    }

    /** @return array<string, string> */
    private function mergedBrandMap(?int $branchId): array
    {
        $teaching = $this->teachingCatalog?->brandMap($branchId) ?? [];

        return array_merge(self::BRAND_MAP, $teaching);
    }

    /** @return array<string, string> */
    private function mergedViToJpMap(?int $branchId): array
    {
        $teaching = $this->teachingCatalog?->viToJpMap($branchId) ?? [];

        return array_merge(self::VI_TO_JP_MAP, $teaching);
    }
}
