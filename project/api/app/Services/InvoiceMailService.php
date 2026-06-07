<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\MailHistory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class InvoiceMailService
{
    public function notifyCompanyInvoiceSent(Invoice $invoice): void
    {
        $invoice->loadMissing(['company', 'order', 'items']);

        $email = $invoice->company?->email;

        if (! $email) {
            Log::warning('Invoice sent but company has no email', ['invoice_id' => $invoice->id]);

            return;
        }

        $total = number_format((int) $invoice->total_amount, 0, ',', '.');
        $due = $invoice->due_date?->format('d/m/Y') ?? '';

        $subject = "[Hóa đơn] {$invoice->invoice_no} — Đơn {$invoice->order?->order_no}";
        $body = <<<HTML
        <p>Kính gửi <strong>{$invoice->company?->company_name}</strong>,</p>
        <p>Hóa đơn <strong>{$invoice->invoice_no}</strong> cho đơn hàng <strong>{$invoice->order?->order_no}</strong> đã được phát hành.</p>
        <ul>
          <li>Tổng thanh toán: <strong>{$total} ₫</strong></li>
          <li>Hạn thanh toán: <strong>{$due}</strong></li>
        </ul>
        <p>Vui lòng đăng nhập hệ thống để xem chi tiết và thực hiện chuyển khoản.</p>
        HTML;

        $this->sendAndLog($email, $subject, $body);
    }

    private function sendAndLog(string $email, string $subject, string $body): void
    {
        $history = MailHistory::query()->create([
            'to_address' => $email,
            'subject' => $subject,
            'body' => $body,
            'send_status' => false,
            'created' => now(),
            'deleted_flag' => false,
        ]);

        try {
            Mail::html($body, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
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

            Log::error('Invoice mail failed', ['email' => $email, 'error' => $e->getMessage()]);
        }
    }
}
