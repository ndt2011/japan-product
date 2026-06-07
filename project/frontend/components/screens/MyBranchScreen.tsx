"use client";

import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import type { BranchItem } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MyBranchScreen() {
  const user = useAuthStore((s) => s.user);
  const [branch, setBranch] = useState<BranchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/proxy/my-branch");
        const data = await res.json();
        if (data.success && data.data?.branch) {
          setBranch(data.data.branch);
        } else {
          setError(translateMessage(data.message ?? "M0001"));
        }
      } catch {
        setError("API_OFFLINE");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chi Nhánh Của Tôi"
        description={user?.full_name ? `Xin chào ${user.full_name}` : undefined}
      />

      {error && <p className="text-sm text-red-600">{translateMessage(error)}</p>}

      <Card>
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : branch ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-gray-500">Mã chi nhánh</dt>
              <dd className="font-medium">{branch.branch_cd}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Tên</dt>
              <dd className="font-medium">{branch.branch_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Miền</dt>
              <dd>{branch.region}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Tỉnh/TP</dt>
              <dd>{branch.province}</dd>
            </div>
            {branch.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-gray-500">Địa chỉ</dt>
                <dd>{branch.address}</dd>
              </div>
            )}
            {branch.tel && (
              <div>
                <dt className="text-xs text-gray-500">Điện thoại</dt>
                <dd>{branch.tel}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500">Vai trò của bạn</dt>
              <dd>
                <Badge variant="primary">{user?.role ?? user?.user_type}</Badge>
              </dd>
            </div>
            {user?.user_type === "branch_manager" && branch.id && (
              <div className="sm:col-span-2">
                <Link href={`/admin/branches/${branch.id}/users`}>
                  <Button variant="secondary">Quản lý nhân viên chi nhánh</Button>
                </Link>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-500">Không có dữ liệu chi nhánh.</p>
        )}
      </Card>
    </div>
  );
}
