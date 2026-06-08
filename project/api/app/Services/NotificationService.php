<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\BranchUser;
use App\Models\Notification;
use App\Models\Order;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * spec: docs/sa/amendments/upgrade-v3-analysis.md §4
 */
class NotificationService
{
    public function send(
        string $userType,
        int $userId,
        string $type,
        string $title,
        ?string $body = null,
        ?string $dataType = null,
        ?int $dataId = null,
    ): Notification {
        return Notification::query()->create([
            'user_type' => $userType,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data_type' => $dataType,
            'data_id' => $dataId,
            'is_read' => false,
            'created' => now(),
        ]);
    }

    public function notifyAllAdmins(
        string $type,
        string $title,
        ?string $body = null,
        ?string $dataType = null,
        ?int $dataId = null,
    ): void {
        Admin::query()
            ->where('disabled_flag', false)
            ->where('deleted_flag', false)
            ->each(fn (Admin $admin) => $this->send(
                'admin',
                $admin->id,
                $type,
                $title,
                $body,
                $dataType,
                $dataId,
            ));
    }

    public function notifyOrderOwners(Order $order, string $type, string $title, ?string $body = null): void
    {
        if ($order->branch_id) {
            BranchUser::query()
                ->where('branch_id', $order->branch_id)
                ->where('disabled_flag', false)
                ->where('deleted_flag', false)
                ->each(fn (BranchUser $user) => $this->send(
                    'branch',
                    $user->id,
                    $type,
                    $title,
                    $body,
                    'order',
                    $order->id,
                ));

            return;
        }

        if ($order->company_vn_id) {
            $this->send(
                'company',
                (int) $order->company_vn_id,
                $type,
                $title,
                $body,
                'order',
                $order->id,
            );
        }
    }

    public function listForUser(Authenticatable $user, string $userType, array $filters): LengthAwarePaginator
    {
        $query = Notification::query()->orderByDesc('created');

        match ($userType) {
            'admin' => $query->where('user_type', 'admin')->where('user_id', $user->id),
            'company' => $query->where('user_type', 'company')->where('user_id', $user->id),
            default => $query->where('user_type', 'branch')->where('user_id', $user->id),
        };

        if (! empty($filters['unread'])) {
            $query->where('is_read', false);
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 50);

        return $query->paginate($perPage);
    }

    public function unreadCount(Authenticatable $user, string $userType): int
    {
        $query = Notification::query()->where('is_read', false);

        match ($userType) {
            'admin' => $query->where('user_type', 'admin')->where('user_id', $user->id),
            'company' => $query->where('user_type', 'company')->where('user_id', $user->id),
            default => $query->where('user_type', 'branch')->where('user_id', $user->id),
        };

        return (int) $query->count();
    }

    public function markRead(int $id, Authenticatable $user, string $userType): Notification
    {
        $notification = $this->findForUser($id, $user, $userType);
        $notification->update(['is_read' => true]);

        return $notification;
    }

    public function markAllRead(Authenticatable $user, string $userType): int
    {
        $query = Notification::query()->where('is_read', false);

        match ($userType) {
            'admin' => $query->where('user_type', 'admin')->where('user_id', $user->id),
            'company' => $query->where('user_type', 'company')->where('user_id', $user->id),
            default => $query->where('user_type', 'branch')->where('user_id', $user->id),
        };

        return $query->update(['is_read' => true]);
    }

    private function findForUser(int $id, Authenticatable $user, string $userType): Notification
    {
        $userTypeKey = match ($userType) {
            'admin' => 'admin',
            'company' => 'company',
            default => 'branch',
        };

        return Notification::query()
            ->where('id', $id)
            ->where('user_type', $userTypeKey)
            ->where('user_id', $user->id)
            ->firstOrFail();
    }
}
