<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('company_vn_id');
            $table->string('invoice_no', 20)->unique();
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('amount_vnd', 15, 0)->default(0);
            $table->decimal('tax_amount', 15, 0)->default(0);
            $table->decimal('total_amount', 15, 0)->default(0);
            $table->enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])->default('draft');
            $table->dateTime('paid_at')->nullable();
            $table->decimal('paid_amount', 15, 0)->nullable();
            $table->enum('payment_method', ['bank_transfer', 'cash', 'other'])->nullable();
            $table->text('note')->nullable();
            $table->dateTime('created')->nullable();
            $table->integer('created_user_id')->nullable();
            $table->dateTime('modified')->nullable();
            $table->integer('modified_user_id')->nullable();
            $table->boolean('deleted_flag')->default(false);

            $table->foreign('order_id', 'fk_invoices_order')->references('id')->on('orders');
            $table->foreign('company_vn_id', 'fk_invoices_company')->references('id')->on('companies_vn');
            $table->index(['status', 'due_date']);
            $table->index('company_vn_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
