<?php

namespace App\Services;

use App\Exceptions\AuthException;
use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\CompanyVn;
use App\Repositories\AdminRepository;
use App\Repositories\BranchUserRepository;
use App\Repositories\CompanyVnRepository;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthService
{
    public function __construct(
        private readonly AdminRepository $adminRepository,
        private readonly CompanyVnRepository $companyVnRepository,
        private readonly BranchUserRepository $branchUserRepository,
    ) {}

    /**
     * @return array{user: Authenticatable, user_type: string, token: string}
     */
    public function login(string $loginId, string $password, string $ip, bool $rememberMe = false): array
    {
        $lockKey = $this->lockoutKey($ip, $loginId);
        if ((int) Cache::get($lockKey, 0) >= 5) {
            throw new AuthException('M0106', 429);
        }

        $admin = $this->adminRepository->findActiveByLoginId($loginId);

        if ($admin && Hash::check($password, $admin->password)) {
            return $this->issueToken($admin, 'admin', $loginId, $ip, $rememberMe);
        }

        $company = $this->companyVnRepository->findActiveByLoginId($loginId);

        if ($company && $company->password && Hash::check($password, $company->password)) {
            return $this->issueToken($company, 'company', $loginId, $ip, $rememberMe);
        }

        $branchUser = $this->branchUserRepository->findActiveByLoginId($loginId);

        if ($branchUser && Hash::check($password, $branchUser->password)) {
            return $this->issueToken($branchUser, $branchUser->user_type, $loginId, $ip, $rememberMe);
        }

        $this->recordFailedAttempt($lockKey);
        $this->logAttempt($ip, $loginId, 'Failure');

        throw new AuthException('M0101', 401);
    }

    public function logout(Authenticatable $user): void
    {
        if (method_exists($user, 'currentAccessToken')) {
            $user->currentAccessToken()?->delete();
        }
    }

    /**
     * @return array{user: Authenticatable, user_type: string, token: string}
     */
    private function issueToken(
        Authenticatable $user,
        string $userType,
        string $loginId,
        string $ip,
        bool $rememberMe,
    ): array {
        if (method_exists($user, 'isActive') && ! $user->isActive()) {
            $this->logAttempt($ip, $loginId, 'Disabled-Failure');

            throw new AuthException('M0102', 403);
        }

        $expiresAt = $rememberMe ? now()->addDays(30) : now()->addHours(24);

        /** @var Admin|CompanyVn $user */
        $accessToken = $user->createToken('api-token', ['*'], $expiresAt);
        Cache::forget($this->lockoutKey($ip, $loginId));
        $this->logAttempt($ip, $loginId, 'Success');

        return [
            'user' => $user,
            'user_type' => $userType,
            'token' => $accessToken->plainTextToken,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    private function lockoutKey(string $ip, string $loginId): string
    {
        return 'login_attempts:'.md5($ip.'|'.$loginId);
    }

    private function recordFailedAttempt(string $lockKey): void
    {
        $attempts = (int) Cache::get($lockKey, 0) + 1;
        Cache::put($lockKey, $attempts, now()->addMinutes(30));
    }

    private function logAttempt(string $ip, string $loginId, string $result): void
    {
        Log::channel('login')->info(sprintf(
            '%s [%s] Login login_id:%s %s',
            now()->format('Y-m-d H:i:s'),
            $ip,
            $loginId,
            $result,
        ));
    }
}
