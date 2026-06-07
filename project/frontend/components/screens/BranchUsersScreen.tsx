"use client";

import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import { useAuthStore } from "@/stores/useAuthStore";
import type { BranchUserItem } from "@/types/api";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface Props {
  branchId: number;
}

export function BranchUsersScreen({ branchId }: Props) {
  const userType = useAuthStore((s) => s.user?.user_type);
  const [items, setItems] = useState<BranchUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    login_id: "",
    password: "",
    full_name: "",
    email: "",
    role: "staff" as "manager" | "staff",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/branches/${branchId}/users`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setItems(data.data.items);
      } else {
        setError(translateMessage(data.message ?? "M0001"));
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/proxy/branches/${branchId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setShowForm(false);
      setForm({ login_id: "", password: "", full_name: "", email: "", role: "staff" });
      await loadUsers();
    } catch {
      setError("API_OFFLINE");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(userId: number) {
    const res = await fetch(`/api/proxy/branches/${branchId}/users/${userId}/toggle`, {
      method: "PUT",
    });
    const data = await res.json();
    if (data.success) await loadUsers();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhân Viên Chi Nhánh"
        subtitle={`Chi nhánh #${branchId}`}
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Đóng form" : "+ Thêm nhân viên"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Login ID"
              value={form.login_id}
              onChange={(e) => setForm({ ...form, login_id: e.target.value })}
              required
            />
            <Input
              label="Mật khẩu"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              label="Họ tên"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {userType === "admin" && (
              <Select
                label="Vai trò"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "manager" | "staff" })}
                options={[
                  { value: "staff", label: "Staff" },
                  { value: "manager", label: "Manager" },
                ]}
              />
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Tạo user"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{translateMessage(error)}</p>}

      <Card>
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Login</Th>
                <Th>Họ tên</Th>
                <Th>Vai trò</Th>
                <Th>Trạng thái</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {items.map((u) => (
                <Tr key={u.id}>
                  <Td>{u.login_id}</Td>
                  <Td>{u.full_name}</Td>
                  <Td>
                    <Badge variant={u.role === "manager" ? "primary" : "gray"}>
                      {u.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={u.disabled_flag ? "danger" : "success"}>
                      {u.disabled_flag ? "Tắt" : "Hoạt động"}
                    </Badge>
                  </Td>
                  <Td>
                    <Button variant="secondary" size="sm" onClick={() => toggleUser(u.id)}>
                      {u.disabled_flag ? "Bật" : "Tắt"}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
