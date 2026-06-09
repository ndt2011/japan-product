<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageStorageService
{
    public function disk(): string
    {
        return config('filesystems.product_images_disk', 'public');
    }

    public function uploadAvatar(UploadedFile $file, string $userType, int $userId): string
    {
        $disk = $this->disk();
        $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
        $filename = sprintf(
            'avatars/%s/%d/%s.%s',
            $userType,
            $userId,
            Str::uuid()->toString(),
            strtolower($extension),
        );

        Storage::disk($disk)->put($filename, $file->get(), 'public');

        return $this->resolveStoredPath($filename);
    }

    public function upload(UploadedFile $file, int $productId): string
    {
        $disk = $this->disk();
        $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
        $filename = sprintf(
            'products/%d/%s.%s',
            $productId,
            Str::uuid()->toString(),
            strtolower($extension),
        );

        Storage::disk($disk)->put($filename, $file->get(), 'public');

        return $this->resolveStoredPath($filename);
    }

    public function publicUrl(string $pathOrUrl): string
    {
        $path = $this->normalizePath($pathOrUrl);
        $disk = $this->disk();
        $baseUrl = config("filesystems.disks.{$disk}.url");

        if ($baseUrl) {
            return Storage::disk($disk)->url($path);
        }

        // Railway Bucket (private): presigned URL khi trả API
        return Storage::disk($disk)->temporaryUrl($path, now()->addDays(7));
    }

    private function resolveStoredPath(string $filename): string
    {
        $disk = $this->disk();
        $baseUrl = config("filesystems.disks.{$disk}.url");

        if ($baseUrl) {
            return Storage::disk($disk)->url($filename);
        }

        return $filename;
    }

    private function normalizePath(string $pathOrUrl): string
    {
        if (! str_starts_with($pathOrUrl, 'http://') && ! str_starts_with($pathOrUrl, 'https://')) {
            return $pathOrUrl;
        }

        if (preg_match('#/(?:products/\d+|avatars/[^/]+/\d+)/[^/?]+#', $pathOrUrl, $m)) {
            return ltrim($m[0], '/');
        }

        $disk = Storage::disk($this->disk());
        $baseUrl = rtrim((string) config("filesystems.disks.{$this->disk()}.url"), '/');

        if ($baseUrl !== '' && str_starts_with($pathOrUrl, $baseUrl)) {
            return ltrim(substr($pathOrUrl, strlen($baseUrl)), '/');
        }

        return $pathOrUrl;
    }

    public function uploadFromUrl(string $url, int $productId): ?string
    {
        $url = trim($url);

        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        try {
            $response = Http::timeout(20)->get($url);

            if (! $response->successful()) {
                return null;
            }

            $contentType = (string) $response->header('Content-Type');
            $extension = $this->extensionFromContentType($contentType) ?? 'jpg';
            $body = $response->body();

            if ($body === '') {
                return null;
            }

            $disk = $this->disk();
            $filename = sprintf(
                'products/%d/%s.%s',
                $productId,
                Str::uuid()->toString(),
                $extension,
            );

            Storage::disk($disk)->put($filename, $body, 'public');

            return $this->resolveStoredPath($filename);
        } catch (\Throwable $e) {
            Log::warning('Failed to import product image from URL', [
                'product_id' => $productId,
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function extensionFromContentType(string $contentType): ?string
    {
        return match (true) {
            str_contains($contentType, 'png') => 'png',
            str_contains($contentType, 'webp') => 'webp',
            str_contains($contentType, 'gif') => 'gif',
            str_contains($contentType, 'jpeg'), str_contains($contentType, 'jpg') => 'jpg',
            default => null,
        };
    }

    public function deleteByUrl(string $url): void
    {
        $path = $this->pathFromUrl($url);

        if ($path && Storage::disk($this->disk())->exists($path)) {
            Storage::disk($this->disk())->delete($path);
        }
    }

    private function pathFromUrl(string $url): ?string
    {
        if (! str_starts_with($url, 'http://') && ! str_starts_with($url, 'https://')) {
            return $url;
        }

        $normalized = $this->normalizePath($url);

        return $normalized !== $url ? $normalized : null;
    }
}
