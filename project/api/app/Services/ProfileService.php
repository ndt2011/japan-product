<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\CompanyVn;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

class ProfileService
{
    public function __construct(
        private readonly ImageStorageService $imageStorageService,
    ) {}
    /**
     * @return array<string, mixed>
     */
    public function show(Authenticatable $user, string $userType): array
    {
        return $this->present($user, $userType);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function update(Authenticatable $user, string $userType, array $data): array
    {
        $payload = [];

        if (isset($data['full_name'])) {
            $payload['full_name'] = $data['full_name'];
        }
        if (isset($data['email'])) {
            $payload['email'] = $data['email'];
        }
        if (array_key_exists('phone', $data)) {
            $payload['phone'] = $data['phone'];
        }
        if (array_key_exists('avatar_url', $data)) {
            $payload['avatar_url'] = $data['avatar_url'];
        }
        if (! empty($data['password'])) {
            $payload['password'] = Hash::make((string) $data['password']);
        }

        if ($userType === 'company' && isset($data['contact_name'])) {
            $payload['contact_name'] = $data['contact_name'];
        }

        if ($payload !== []) {
            $payload['modified'] = now();
            $user->update($payload);
            $user->refresh();
        }

        return $this->present($user->fresh(), $userType);
    }

    /**
     * @return array<string, mixed>
     */
    public function uploadAvatar(Authenticatable $user, string $userType, UploadedFile $file): array
    {
        $oldUrl = $user->avatar_url ?? null;
        $url = $this->imageStorageService->uploadAvatar($file, $userType, (int) $user->id);

        if (is_string($oldUrl) && $oldUrl !== '') {
            $this->imageStorageService->deleteByUrl($oldUrl);
        }

        $user->update([
            'avatar_url' => $url,
            'modified' => now(),
        ]);

        return $this->present($user->fresh(), $userType);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Authenticatable $user, string $userType): array
    {
        $base = [
            'id' => $user->id,
            'user_type' => $userType,
            'login_id' => $user->login_id,
            'email' => $user->email ?? null,
            'phone' => $user->phone ?? null,
            'avatar_url' => $user->avatar_url ?? null,
        ];

        return match ($userType) {
            'admin' => array_merge($base, [
                'full_name' => $user instanceof Admin ? $user->full_name : null,
            ]),
            'company' => array_merge($base, [
                'company_name' => $user instanceof CompanyVn ? $user->company_name : null,
                'contact_name' => $user instanceof CompanyVn ? $user->contact_name : null,
            ]),
            default => array_merge($base, [
                'full_name' => $user instanceof BranchUser ? $user->full_name : null,
                'branch_id' => $user instanceof BranchUser ? $user->branch_id : null,
                'role' => $user instanceof BranchUser ? $user->role : null,
            ]),
        };
    }
}
