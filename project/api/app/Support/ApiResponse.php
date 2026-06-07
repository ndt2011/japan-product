<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'M0000', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'errors' => null,
        ], $status);
    }

    public static function error(
        string $message,
        mixed $errors = null,
        int $status = 400,
        mixed $data = null,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'data' => $data,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
