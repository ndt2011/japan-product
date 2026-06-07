<?php

namespace App\Exceptions;

use Exception;

class InvoiceException extends Exception
{
    public function __construct(
        public readonly string $messageCode,
        public readonly int $status = 400,
    ) {
        parent::__construct($messageCode);
    }
}
