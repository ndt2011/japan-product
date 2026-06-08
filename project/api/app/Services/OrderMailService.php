<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\MailHistory;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OrderMailService
{
    public function notifyAdminsNewOrder(Order $order): void
    {
        $order->loadMissing('company');

        $recipients = Admin::query()
            ->where('disabled_flag', false)
            ->where('deleted_flag', false)
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->pluck('email')
            ->unique()
            ->values()
            ->all();

        $fallback = config('mail.order_notify_address');
        if ($recipients === [] && $fallback) {
            $recipients = [$fallback];
        }

        if ($recipients === []) {
            Log::warning('Order submitted but no admin email configured', ['order_id' => $order->id]);

            return;
        }

        $subject = "[Đơn mới] {$order->order_no} — {$order->company?->company_name}";
        $body = $this->buildNewOrderBody($order);

        foreach ($recipients as $email) {
            $this->sendAndLog($email, $subject, $body);
        }
    }

    public function notifyCompanyOrderConfirmed(Order $order): void
    {
        $order->loadMissing('company');

        $email = $order->company?->email;

        if (! $email) {
            Log::warning('Order confirmed but company has no email', ['order_id' => $order->id]);

            return;
        }

        $subject = "[APPROVED] Đơn {$order->order_no} đã được duyệt";
        $body = $this->buildConfirmedOrderBody($order);

        $this->sendAndLog($email, $subject, $body);
    }

    private function buildNewOrderBody(Order $order): string
    {
        $company = $order->company?->company_name ?? 'N/A';
        $totalVnd = number_format((int) $order->total_vnd, 0, ',', '.');

        return <<<HTML
        <p>Công ty <strong>{$company}</strong> vừa gửi đơn hàng mới.</p>
        <ul>
          <li>Mã đơn: <strong>{$order->order_no}</strong></li>
          <li>Trạng thái: PENDING</li>
          <li>Tổng VND: {$totalVnd} ₫</li>
          <li>Tỷ giá: {$order->exchange_rate}</li>
        </ul>
        <p>Vui lòng đăng nhập hệ thống để xác nhận đơn.</p>
        HTML;
    }

    private function buildConfirmedOrderBody(Order $order): string
    {
        $totalVnd = number_format((int) $order->total_vnd, 0, ',', '.');

        return <<<HTML
        <p>Đơn hàng <strong>{$order->order_no}</strong> đã được JP Agency xác nhận.</p>
        <ul>
          <li>Trạng thái: APPROVED — vui lòng thanh toán</li>
          <li>Tổng VND: {$totalVnd} ₫</li>
          <li>Tỷ giá khóa: {$order->exchange_rate}</li>
        </ul>
        HTML;
    }

    private function sendAndLog(string $to, string $subject, string $body, ?int $actorId = null): void
    {
        $history = MailHistory::query()->create([
            'to_address' => $to,
            'subject' => $subject,
            'body' => $body,
            'send_status' => false,
            'created' => now(),
            'created_user_id' => $actorId,
            'deleted_flag' => false,
        ]);

        try {
            Mail::html($body, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });

            $history->update([
                'send_status' => true,
                'sent_at' => now(),
                'modified' => now(),
            ]);
        } catch (\Throwable $e) {
            $history->update([
                'error_message' => $e->getMessage(),
                'modified' => now(),
            ]);

            Log::error('Order mail failed', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
