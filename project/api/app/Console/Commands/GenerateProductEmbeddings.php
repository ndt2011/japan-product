<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\ProductEmbeddingService;
use Illuminate\Console\Command;

class GenerateProductEmbeddings extends Command
{
    protected $signature = 'products:embed
                            {--force : Re-embed all products}
                            {--id= : Embed a single product by ID}';

    protected $description = 'Generate OpenAI embeddings for products in catalog';

    public function handle(ProductEmbeddingService $service): int
    {
        if (! config('services.openai.api_key')) {
            $this->error('OPENAI_API_KEY is not set. Skipping embedding generation.');

            return 1;
        }

        $query = Product::query()
            ->active()
            ->where('disabled_flag', false);

        if ($id = $this->option('id')) {
            $query->where('id', $id);
        } elseif (! $this->option('force')) {
            $query->whereNull('embedding');
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->info('No products need embedding.');

            return 0;
        }

        $this->info("Embedding {$products->count()} product(s)...");
        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        $success = 0;
        $failed = 0;

        foreach ($products as $product) {
            try {
                $service->embedProduct($product);
                $success++;
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error("Product #{$product->id}: {$e->getMessage()}");
            }

            $bar->advance();
            usleep(200_000);
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Done: {$success} ok, {$failed} failed.");

        return $failed > 0 ? 1 : 0;
    }
}
