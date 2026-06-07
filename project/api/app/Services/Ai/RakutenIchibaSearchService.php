<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RakutenIchibaSearchService
{
    private const API_URL = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401';

    private ?string $lastErrorCode = null;

    public function isConfigured(): bool
    {
        return config('services.rakuten.application_id') !== ''
            && config('services.rakuten.access_key') !== '';
    }

    public function getLastErrorCode(): ?string
    {
        return $this->lastErrorCode;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $keyword, int $limit = 10): array
    {
        $this->lastErrorCode = null;

        if (! $this->isConfigured()) {
            return [];
        }

        $keyword = trim($keyword);

        if ($keyword === '') {
            return [];
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders($this->requestHeaders())
                ->get(self::API_URL, [
                    'applicationId' => config('services.rakuten.application_id'),
                    'accessKey' => config('services.rakuten.access_key'),
                    'affiliateId' => config('services.rakuten.affiliate_id') ?: null,
                    'keyword' => $keyword,
                    'format' => 'json',
                    'formatVersion' => 2,
                    'hits' => min(max($limit, 1), 30),
                    'page' => 1,
                    'availability' => 1,
                    'imageFlag' => 1,
                    'sort' => 'standard',
                    'elements' => 'itemName,itemPrice,itemUrl,affiliateUrl,itemCode,itemCaption,catchcopy,shopName,genreName,mediumImageUrls,smallImageUrls',
                ]);

            if (! $response->successful()) {
                $this->lastErrorCode = $response->json('errors.errorMessage')
                    ?? $response->json('error_description')
                    ?? 'HTTP_'.$response->status();

                Log::warning('Rakuten Ichiba search HTTP error', [
                    'status' => $response->status(),
                    'error' => $this->lastErrorCode,
                    'body' => $response->body(),
                ]);

                return [];
            }

            $body = $response->json();

            if (! is_array($body) || isset($body['error']) || isset($body['errors'])) {
                $this->lastErrorCode = $body['errors']['errorMessage']
                    ?? $body['error_description']
                    ?? $body['error']
                    ?? 'API_ERROR';

                Log::warning('Rakuten Ichiba search API error', ['error' => $this->lastErrorCode]);

                return [];
            }

            $items = $body['Items'] ?? $body['items'] ?? [];

            if (! is_array($items) || $items === []) {
                $this->lastErrorCode = 'NO_RESULTS';

                return [];
            }

            return $this->normalizeItems($items, $limit);
        } catch (\Throwable $e) {
            $this->lastErrorCode = 'EXCEPTION';
            Log::warning('Rakuten Ichiba search exception', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * @return array<string, string>
     */
    private function requestHeaders(): array
    {
        $origin = config('services.rakuten.origin_url', 'http://localhost:3000');

        return array_filter([
            'Origin' => $origin,
            'Referer' => rtrim($origin, '/').'/',
            'User-Agent' => 'JapanProductSourcing/1.0',
        ]);
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, array<string, mixed>>
     */
    private function normalizeItems(array $items, int $limit): array
    {
        $normalized = [];

        foreach (array_slice($items, 0, $limit) as $index => $row) {
            $item = is_array($row['item'] ?? null) ? $row['item'] : $row;

            if (! is_array($item) || empty($item['itemName'])) {
                continue;
            }

            $itemCode = (string) ($item['itemCode'] ?? ('rakuten-'.$index));
            $imageUrl = $this->resolveImageUrl($item);
            $sourceUrl = $this->normalizeUrl($item['itemUrl'] ?? $item['affiliateUrl'] ?? null);

            $normalized[] = [
                'external_id' => 'rakuten-'.$itemCode,
                'product_name_jp' => (string) $item['itemName'],
                'image_url' => $imageUrl,
                'price_jpy' => (int) ($item['itemPrice'] ?? 0),
                'source_url' => $sourceUrl,
                'source_platform' => 'rakuten',
                'description' => $this->buildDescription($item),
                'data_source' => 'rakuten_api',
                'genre_name' => $item['genreName'] ?? null,
            ];
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function resolveImageUrl(array $item): ?string
    {
        foreach (['mediumImageUrls', 'smallImageUrls', 'imageUrl', 'itemImageUrl'] as $field) {
            $value = $item[$field] ?? null;

            if (is_string($value) && $value !== '') {
                return $this->normalizeUrl($value);
            }

            if (! is_array($value) || $value === []) {
                continue;
            }

            $first = $value[0];

            if (is_string($first)) {
                return $this->normalizeUrl($first);
            }

            if (is_array($first)) {
                $url = $first['imageUrl'] ?? $first['imageURL'] ?? $first['url'] ?? null;

                if (is_string($url) && $url !== '') {
                    return $this->normalizeUrl($url);
                }
            }
        }

        return null;
    }

    private function normalizeUrl(?string $url): ?string
    {
        if (! is_string($url) || trim($url) === '') {
            return null;
        }

        $url = trim($url);

        if (str_starts_with($url, '//')) {
            return 'https:'.$url;
        }

        return $url;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function buildDescription(array $item): ?string
    {
        $parts = array_filter([
            $item['catchcopy'] ?? null,
            $item['itemCaption'] ?? null,
            isset($item['shopName']) ? 'Shop: '.$item['shopName'] : null,
        ]);

        if ($parts === []) {
            return null;
        }

        $text = implode("\n", $parts);

        return mb_strlen($text) > 500 ? mb_substr($text, 0, 500).'…' : $text;
    }
}
