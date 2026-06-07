<?php

namespace App\Exceptions;

use RuntimeException;

class AuthException extends RuntimeException
{
    public function __construct(
        public readonly string $messageCode,
        public readonly int $status,
    ) {
        parent::__construct($messageCode);
    }
}
