<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use App\Support\AuthContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $auth = AuthContext::from($request);

        if (! $auth['user']) {
            return ApiResponse::error('M0401', null, 401);
        }

        $type = $auth['type'];
        $allowed = false;

        foreach ($roles as $role) {
            if ($role === 'branch' && str_starts_with($type, 'branch_')) {
                $allowed = true;
                break;
            }

            if ($type === $role) {
                $allowed = true;
                break;
            }
        }

        if (! $allowed) {
            return ApiResponse::error('M0403', null, 403);
        }

        return $next($request);
    }
}
