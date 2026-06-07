<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageStorageService
{
    public function disk(): string
    {
        return config('filesystems.product_images_disk', 'public');
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

        return Storage::disk($disk)->url($filename);
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
        $disk = Storage::disk($this->disk());
        $baseUrl = rtrim($disk->url(''), '/');

        if (! str_starts_with($url, $baseUrl)) {
            return null;
        }

        return ltrim(substr($url, strlen($baseUrl)), '/');
    }
}
