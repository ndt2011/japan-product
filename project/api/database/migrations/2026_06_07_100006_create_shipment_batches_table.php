<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipment_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_no', 50);
            $table->string('batch_name', 255);
            $table->string('status', 30)->default('PREPARING');
            $table->string('logistics_partner', 255)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->date('estimated_departure_date')->nullable();
            $table->unsignedBigInteger('created_admin_id');
            $table->dateTime('created')->nullable();
            $table->dateTime('modified')->nullable();
            $table->boolean('deleted_flag')->default(false);
            $table->foreign('created_admin_id', 'fk_batches_admin')->references('id')->on('admins');
        });

        Schema::create('batch_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shipment_batch_id');
            $table->unsignedBigInteger('order_id');
            $table->dateTime('created')->nullable();
            $table->foreign('shipment_batch_id', 'fk_batch_items_batch')->references('id')->on('shipment_batches');
            $table->foreign('order_id', 'fk_batch_items_order')->references('id')->on('orders');
            $table->unique('order_id', 'uq_batch_order_items_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_order_items');
        Schema::dropIfExists('shipment_batches');
    }
};
