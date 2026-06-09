<?php

namespace App\Providers;

use App\Support\AuthContext;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\RateLimiter;
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
        RateLimiter::for('ai-purchasing', function (Request $request) {
            $auth = AuthContext::from($request);
            $key = $auth['type'].':'.$auth['id'];

            return Limit::perHour(10)->by($key);
        });

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
