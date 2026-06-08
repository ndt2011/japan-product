<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// 9h JST: Kiểm tra hóa đơn quá hạn → overdue
Schedule::command('invoices:check-overdue')->dailyAt('09:00')->timezone('Asia/Tokyo');

// 8h JST: Tự động COMPLETED đơn DELIVERED_ADMIN quá 7 ngày không xác nhận
Schedule::command('orders:auto-complete')->dailyAt('08:00')->timezone('Asia/Tokyo');
