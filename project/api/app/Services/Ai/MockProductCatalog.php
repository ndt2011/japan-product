<?php

namespace App\Services\Ai;

class MockProductCatalog
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            [
                'external_id' => 'rakuten-dhc-collagen-360',
                'product_name_jp' => 'DHC コラーゲン 360粒',
                'image_url' => 'https://placehold.co/200x200/png?text=DHC',
                'price_jpy' => 1188,
                'source_url' => 'https://item.rakuten.co.jp/example/dhc-collagen',
                'source_platform' => 'rakuten',
                'description' => 'DHCのコラーゲンサプリメント。1日12粒目安。',
            ],
            [
                'external_id' => 'rakuten-fancl-vitc',
                'product_name_jp' => 'ファンケル ビタミンC',
                'image_url' => 'https://placehold.co/200x200/png?text=Fancl',
                'price_jpy' => 1020,
                'source_url' => 'https://item.rakuten.co.jp/example/fancl-vitc',
                'source_platform' => 'rakuten',
                'description' => 'ビタミンCを1日1本手軽に摂取できるドリンクタイプ。',
            ],
            [
                'external_id' => 'amazon-otsuka-omega3',
                'product_name_jp' => '大塚製薬 オメガ3 EPA+DHA',
                'image_url' => 'https://placehold.co/200x200/png?text=Omega3',
                'price_jpy' => 2480,
                'source_url' => 'https://www.amazon.co.jp/dp/example-omega3',
                'source_platform' => 'amazon',
                'description' => '青魚由来のオメガ3脂肪酸サプリメント。',
            ],
            [
                'external_id' => 'rakuten-shiseido-collagen',
                'product_name_jp' => '資生堂 コラーゲン EX',
                'image_url' => 'https://placehold.co/200x200/png?text=Shiseido',
                'price_jpy' => 3500,
                'source_url' => 'https://item.rakuten.co.jp/example/shiseido-collagen',
                'source_platform' => 'rakuten',
                'description' => '低分子コラーゲン配合の美容サプリ。',
            ],
            [
                'external_id' => 'amazon-naturemade-vitamin',
                'product_name_jp' => 'ネイチャーメイド マルチビタミン',
                'image_url' => 'https://placehold.co/200x200/png?text=Vitamin',
                'price_jpy' => 1980,
                'source_url' => 'https://www.amazon.co.jp/dp/example-vitamin',
                'source_platform' => 'amazon',
                'description' => '13種類のビタミンとミネラルをバランスよく配合。',
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $keyword): array
    {
        $needle = mb_strtolower(trim($keyword));

        if ($needle === '' || preg_match('/xyzabc123none|no-results-test/i', $needle)) {
            return [];
        }

        $matches = array_values(array_filter(self::all(), function (array $item) use ($needle) {
            $haystack = mb_strtolower(implode(' ', [
                $item['product_name_jp'],
                $item['description'] ?? '',
                $item['source_platform'],
            ]));

            foreach (preg_split('/\s+/u', $needle) as $token) {
                if ($token !== '' && mb_strpos($haystack, mb_strtolower($token)) !== false) {
                    return true;
                }
            }

            return false;
        }));

        if ($matches !== []) {
            return array_slice($matches, 0, 10);
        }

        if (preg_match('/コラーゲン|collagen|ビタミン|vitamin|オメガ|omega|サプリ|tpcn|thực phẩm|dhc|fancl/i', $needle)) {
            return array_slice(self::all(), 0, 3);
        }

        return [];
    }
}
