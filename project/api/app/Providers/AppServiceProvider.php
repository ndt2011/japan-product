<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('queue.default') !== 'database') {
            return;
        }

        // Railway/small deploy: không cần worker riêng — xử lý 1 job sau mỗi request.
        $this->app->terminating(function (): void {
            try {
                Artisan::call('queue:work', [
                    '--once' => true,
                    '--stop-when-empty' => true,
                    '--max-time' => 90,
                ]);
            } catch (\Throwable) {
                // Response đã gửi; bỏ qua lỗi worker.
            }
        });
    }
}
