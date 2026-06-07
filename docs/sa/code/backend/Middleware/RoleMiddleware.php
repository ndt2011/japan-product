<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Kiểm tra user_type có khớp với role yêu cầu không.
     *
     * Cách dùng trong routes:
     *   ->middleware('role:admin')            // chỉ admin
     *   ->middleware('role:company_vn')       // chỉ company VN
     *   ->middleware('role:branch_manager')   // chỉ branch manager
     *   ->middleware('role:branch')           // bất kỳ branch user (wildcard)
     *   ->middleware('role:admin,company_vn') // admin hoặc company VN
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'M4010', // Chưa đăng nhập
            ], 401);
        }

        $userType = $user->user_type;

        foreach ($roles as $role) {
            // Wildcard: 'branch' khớp với 'branch_manager', 'branch_staff'
            if ($role === 'branch' && str_starts_with($userType, 'branch_')) {
                return $next($request);
            }

            if ($userType === $role) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'M4030', // Không có quyền
        ], 403);
    }
}
