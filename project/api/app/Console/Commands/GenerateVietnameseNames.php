<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class GenerateVietnameseNames extends Command
{
    protected $signature = 'products:generate-vi {--id= : Chỉ một sản phẩm}';

    protected $description = 'Sinh name_vi + description_vi bằng GPT cho catalog search';

    public function handle(): int
    {
        if (! config('services.openai.api_key')) {
            $this->error('OPENAI_API_KEY is not set.');

            return 1;
        }

        $query = Product::query()
            ->active()
            ->where('disabled_flag', false)
            ->where(function ($q) {
                $q->whereNull('name_vi')->orWhere('name_vi', '');
            });

        if ($id = $this->option('id')) {
            $query->where('id', $id);
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->info('Không có sản phẩm nào cần dịch.');

            return 0;
        }

        $this->info("Dịch {$products->count()} sản phẩm...");
        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        $failed = 0;

        foreach ($products as $product) {
            try {
                $result = $this->translateProduct($product);
                $product->update([
                    'name_vi' => $result['name_vi'] ?? $product->product_name,
                    'description_vi' => $result['description_vi'],
                ]);
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error("Lỗi #{$product->id}: {$e->getMessage()}");
            }

            $bar->advance();
            usleep(500_000);
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Xong. Chạy: php artisan products:embed --force');

        return $failed > 0 ? 1 : 0;
    }

    /**
     * @return array{name_vi: ?string, description_vi: ?string}
     */
    private function translateProduct(Product $product): array
    {
        $info = implode("\n", array_filter([
            "Tên JP: {$product->product_name_jp}",
            "Tên EN/VN: {$product->product_name}",
            "Mã: {$product->product_cd}",
            "Spec: {$product->spec}",
            "Mô tả: {$product->description}",
            "Xuất xứ: {$product->origin}",
        ]));

        $response = Http::withToken(config('services.openai.api_key'))
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'temperature' => 0.3,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Dịch sản phẩm Nhật sang tiếng Việt cho tìm kiếm. JSON: {"name_vi":"...","description_vi":"..."}. '
                            .'name_vi ngắn gọn (max 100 ký tự), description_vi mô tả công dụng (max 300 ký tự).',
                    ],
                    ['role' => 'user', 'content' => "Dịch:\n{$info}"],
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('OpenAI failed: '.$response->status());
        }

        $content = $response->json('choices.0.message.content');
        $data = is_string($content) ? json_decode($content, true) : null;

        if (! is_array($data)) {
            throw new \RuntimeException('Invalid JSON from OpenAI');
        }

        return [
            'name_vi' => $data['name_vi'] ?? null,
            'description_vi' => $data['description_vi'] ?? null,
        ];
    }
}
