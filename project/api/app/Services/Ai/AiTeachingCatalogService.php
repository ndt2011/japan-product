<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

/**
 * Teaching file JSON — dạy AI danh mục / từ khóa theo chi nhánh.
 *
 * Thứ tự merge: global.json → branch_{id}.json (config) → storage override.
 *
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 11.3
 */
class AiTeachingCatalogService
{
    private const CACHE_TTL = 300;

    /**
     * @return array{
     *   version: int,
     *   categories: list<array<string, mixed>>,
     *   vi_to_jp: array<string, string>,
     *   brands: array<string, string>,
     *   session_hints: array<string, mixed>
     * }
     */
    public function loadForBranch(?int $branchId): array
    {
        $cacheKey = 'ai_teaching_'.($branchId ?? 'global');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($branchId) {
            $merged = $this->emptyCatalog();

            $global = $this->readJson($this->configPath('global.json'));
            if ($global !== null) {
                $merged = $this->mergeCatalog($merged, $global);
            }

            if ($branchId !== null) {
                $branchConfig = $this->readJson($this->configPath("branch_{$branchId}.json"));
                if ($branchConfig !== null) {
                    $merged = $this->mergeCatalog($merged, $branchConfig);
                }

                $branchStorage = $this->readJson($this->storagePath("branch_{$branchId}.json"));
                if ($branchStorage !== null) {
                    $merged = $this->mergeCatalog($merged, $branchStorage);
                }
            }

            return $merged;
        });
    }

    /** @return array<string, string> */
    public function viToJpMap(?int $branchId): array
    {
        $catalog = $this->loadForBranch($branchId);
        $map = [];

        foreach ($catalog['categories'] as $category) {
            $jp = (string) ($category['rakuten_jp'] ?? '');
            if ($jp === '') {
                continue;
            }
            foreach ((array) ($category['keywords_vi'] ?? []) as $kw) {
                $key = mb_strtolower(trim((string) $kw));
                if ($key !== '') {
                    $map[$key] = $jp;
                }
            }
        }

        return array_merge($map, $catalog['vi_to_jp']);
    }

    /** @return array<string, string> */
    public function brandMap(?int $branchId): array
    {
        return $this->loadForBranch($branchId)['brands'];
    }

    public function buildPromptContext(?int $branchId): string
    {
        $catalog = $this->loadForBranch($branchId);
        $lines = [];

        if ($branchId !== null && isset($catalog['branch_name'])) {
            $lines[] = 'Chi nhánh: '.$catalog['branch_name'];
        }

        foreach ($catalog['categories'] as $cat) {
            $name = (string) ($cat['name_vi'] ?? '');
            $note = (string) ($cat['staff_note'] ?? '');
            if ($name === '') {
                continue;
            }
            $lines[] = $note !== ''
                ? "- Danh mục \"{$name}\": {$note}"
                : "- Danh mục \"{$name}\"";
        }

        $hints = (array) ($catalog['session_hints']['upsell_notes'] ?? []);
        foreach ($hints as $hint) {
            $lines[] = '- Gợi ý bán hàng: '.(string) $hint;
        }

        return $lines === [] ? '' : "Kiến thức dạy theo chi nhánh:\n".implode("\n", $lines);
    }

    /**
     * Gợi ý từ khóa catalog khi khách nói mơ hồ.
     *
     * @param  list<string>  $interests
     */
    public function suggestSearchFromInterests(array $interests, ?int $branchId): ?string
    {
        if ($interests === []) {
            return null;
        }

        $catalog = $this->loadForBranch($branchId);

        foreach ($catalog['categories'] as $cat) {
            $keywords = (array) ($cat['keywords_vi'] ?? []);
            foreach ($interests as $interest) {
                $interestLower = mb_strtolower($interest);
                foreach ($keywords as $kw) {
                    if (str_contains(mb_strtolower((string) $kw), $interestLower)
                        || str_contains($interestLower, mb_strtolower((string) $kw))) {
                        return (string) $kw;
                    }
                }
            }
        }

        return $interests[0];
    }

    public function clearCache(?int $branchId = null): void
    {
        if ($branchId === null) {
            Cache::forget('ai_teaching_global');

            return;
        }

        Cache::forget('ai_teaching_'.$branchId);
    }

    private function configPath(string $filename): string
    {
        return config_path('ai-teaching/'.$filename);
    }

    private function storagePath(string $filename): string
    {
        return storage_path('app/ai-teaching/'.$filename);
    }

    /** @return array<string, mixed>|null */
    private function readJson(string $path): ?array
    {
        if (! File::exists($path)) {
            return null;
        }

        $decoded = json_decode(File::get($path), true);

        return is_array($decoded) ? $decoded : null;
    }

    /** @return array{version: int, categories: list<array<string, mixed>>, vi_to_jp: array<string, string>, brands: array<string, string>, session_hints: array<string, mixed>} */
    private function emptyCatalog(): array
    {
        return [
            'version' => 1,
            'categories' => [],
            'vi_to_jp' => [],
            'brands' => [],
            'session_hints' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $base
     * @param  array<string, mixed>  $overlay
     * @return array{version: int, categories: list<array<string, mixed>>, vi_to_jp: array<string, string>, brands: array<string, string>, session_hints: array<string, mixed>}
     */
    private function mergeCatalog(array $base, array $overlay): array
    {
        $base['version'] = (int) ($overlay['version'] ?? $base['version']);

        if (isset($overlay['branch_name'])) {
            $base['branch_name'] = $overlay['branch_name'];
        }

        $base['categories'] = array_merge(
            $base['categories'],
            (array) ($overlay['categories'] ?? []),
        );

        foreach ((array) ($overlay['vi_to_jp'] ?? []) as $vi => $jp) {
            $base['vi_to_jp'][mb_strtolower((string) $vi)] = (string) $jp;
        }

        foreach ((array) ($overlay['brands'] ?? []) as $key => $jp) {
            $base['brands'][mb_strtolower((string) $key)] = (string) $jp;
        }

        $base['session_hints'] = array_merge(
            $base['session_hints'],
            (array) ($overlay['session_hints'] ?? []),
        );

        return $base;
    }
}
