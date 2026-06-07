<?php

namespace App\Console\Commands;

use App\Services\InvoiceService;
use Illuminate\Console\Command;

class CheckOverdueInvoices extends Command
{
    protected $signature = 'invoices:check-overdue';

    protected $description = 'Mark sent invoices past due date as overdue';

    public function handle(InvoiceService $invoiceService): int
    {
        $count = $invoiceService->markOverdueInvoices();
        $this->info("Marked {$count} invoice(s) as overdue.");

        return self::SUCCESS;
    }
}
