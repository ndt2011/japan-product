"use client";

import {
  Badge,
  Button,
  Card,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useState } from "react";

const usersData = [
  { id: "USR-001", name: "Admin", email: "admin@company.vn", role: "Admin", status: "active", lastLogin: "07/06/2026 09:15" },
  { id: "USR-002", name: "Kho A", email: "khoa@company.vn", role: "Kho", status: "active", lastLogin: "07/06/2026 08:30" },
  { id: "USR-003", name: "Kế Toán", email: "ketoan@company.vn", role: "Kế Toán", status: "active", lastLogin: "06/06/2026 17:45" },
  { id: "USR-004", name: "Đại Lý Demo", email: "daily@company.vn", role: "Đại Lý", status: "inactive", lastLogin: "01/06/2026 14:20" },
];

const roleVariant: Record<string, "danger" | "primary" | "success" | "warning" | "info"> = {
  Admin: "danger",
  Kho: "primary",
  "Nhà Cung Cấp": "success",
  "Đại Lý": "warning",
  "Kế Toán": "info",
};

export function AdminScreen() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"users" | "permissions">("users");

  const filtered = usersData.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Trị Hệ Thống"
        subtitle="Dữ liệu demo — chờ docs 5-001 và RBAC API"
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
        <>
          <Card className="p-4">
            <SearchInput placeholder="Tìm theo tên, email..." value={search} onChange={setSearch} />
          </Card>
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>Mã</Th>
                  <Th>Họ tên</Th>
                  <Th>Email</Th>
                  <Th>Vai trò</Th>
                  <Th>Đăng nhập cuối</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </Thead>
              <tbody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium">{u.id}</Td>
                    <Td>{u.name}</Td>
                    <Td className="text-text-muted">{u.email}</Td>
                    <Td>
                      <Badge variant={roleVariant[u.role] ?? "gray"}>{u.role}</Badge>
                    </Td>
                    <Td className="text-text-muted">{u.lastLogin}</Td>
                    <Td>
                      <Badge variant={u.status === "active" ? "success" : "gray"}>
                        {u.status === "active" ? "Hoạt động" : "Ngừng"}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
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
