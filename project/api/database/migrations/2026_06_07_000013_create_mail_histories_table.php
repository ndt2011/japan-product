<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_histories', function (Blueprint $table) {
            $table->id();
            $table->integer("mail_template_id")->nullable();
            $table->text("to_address")->nullable(false);
            $table->text("cc_address")->nullable();
            $table->string("subject", 255)->nullable(false);
            $table->text("body")->nullable(false);
            $table->boolean("send_status")->nullable()->default(false);
            $table->dateTime("sent_at")->nullable();
            $table->text("error_message")->nullable();
            $table->dateTime("created")->nullable();
            $table->integer("created_user_id")->nullable();
            $table->dateTime("modified")->nullable();
            $table->integer("modified_user_id")->nullable();
            $table->dateTime("deleted")->nullable();
            $table->boolean("deleted_flag")->nullable()->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_histories');
    }
};
