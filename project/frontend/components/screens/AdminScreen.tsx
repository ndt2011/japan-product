"use client";

import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useState } from "react";

export function AdminScreen() {
  const [tab, setTab] = useState<"users" | "permissions">("users");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Trị Hệ Thống"
        subtitle="Quản lý người dùng và phân quyền"
        actions={
          <Button size="sm" disabled>
            + Thêm người dùng
          </Button>
        }
      />

      <div className="flex gap-2">
        {(["users", "permissions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              tab === t ? "bg-brand text-white" : "bg-white border border-border text-text-body hover:bg-surface-muted"
            }`}
          >
            {t === "users" ? "👤 Người Dùng" : "🔐 Phân Quyền"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <Card>
          <EmptyState message="Chưa có API quản trị người dùng. Dùng tài khoản đã seed (admin / vn_company01) để đăng nhập." />
        </Card>
      )}

      {tab === "permissions" && (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-sm text-text-muted">Ma trận phân quyền sẽ hiển thị khi có docs RBAC (REQ-003)</p>
        </Card>
      )}
    </div>
  );
}
