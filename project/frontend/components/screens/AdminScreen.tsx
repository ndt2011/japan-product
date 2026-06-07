"use client";

import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { AdminUserItem, CompanyUserItem } from "@/types/api";
import { FormEvent, useCallback, useEffect, useState } from "react";

type UserRoleTab = "admin" | "company";

export function AdminScreen() {
  const [tab, setTab] = useState<"users" | "permissions">("users");
  const [roleTab, setRoleTab] = useState<UserRoleTab>("admin");
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [companies, setCompanies] = useState<CompanyUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    login_id: "",
    password: "",
    full_name: "",
    email: "",
  });
  const [companyForm, setCompanyForm] = useState({
    login_id: "",
    password: "",
    company_cd: "",
    company_name: "",
    contact_name: "",
    email: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [aRes, cRes] = await Promise.all([
        fetch("/api/proxy/admin-users"),
        fetch("/api/proxy/company-users"),
      ]);
      const aData = await aRes.json();
      const cData = await cRes.json();
      if (aData.success && aData.data?.items) setAdmins(aData.data.items);
      if (cData.success && cData.data?.items) setCompanies(cData.data.items);
      if (!aData.success && !cData.success) {
        setError(translateMessage(aData.message ?? "M0001"));
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab, loadUsers]);

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setShowForm(false);
      setAdminForm({ login_id: "", password: "", full_name: "", email: "" });
      await loadUsers();
    } catch {
      setError("API_OFFLINE");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCompany(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/company-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      const data = await res.json();
      if (!data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }
      setShowForm(false);
      setCompanyForm({
        login_id: "",
        password: "",
        company_cd: "",
        company_name: "",
        contact_name: "",
        email: "",
      });
      await loadUsers();
    } catch {
      setError("API_OFFLINE");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAdmin(id: number) {
    const res = await fetch(`/api/proxy/admin-users/${id}/toggle`, { method: "PUT" });
    const data = await res.json();
    if (data.success) await loadUsers();
  }

  async function toggleCompany(id: number) {
    const res = await fetch(`/api/proxy/company-users/${id}/toggle`, { method: "PUT" });
    const data = await res.json();
    if (data.success) await loadUsers();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Trị Hệ Thống"
        subtitle="Tạo tài khoản Admin hoặc Công ty VN (đại lý)"
        actions={
          tab === "users" ? (
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Đóng form" : "+ Thêm người dùng"}
            </Button>
          ) : undefined
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setRoleTab("admin"); setShowForm(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                roleTab === "admin" ? "bg-brand/10 text-brand font-medium" : "text-text-muted"
              }`}
            >
              Admin (JP)
            </button>
            <button
              type="button"
              onClick={() => { setRoleTab("company"); setShowForm(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                roleTab === "company" ? "bg-brand/10 text-brand font-medium" : "text-text-muted"
              }`}
            >
              Công ty VN / Đại lý
            </button>
          </div>

          {showForm && roleTab === "admin" && (
            <Card>
              <form onSubmit={handleCreateAdmin} className="grid gap-4 md:grid-cols-2">
                <Input label="Login ID" value={adminForm.login_id} onChange={(e) => setAdminForm({ ...adminForm, login_id: e.target.value })} required />
                <Input label="Mật khẩu" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required />
                <Input label="Họ tên" value={adminForm.full_name} onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })} required />
                <Input label="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Tạo Admin"}</Button>
                </div>
              </form>
            </Card>
          )}

          {showForm && roleTab === "company" && (
            <Card>
              <form onSubmit={handleCreateCompany} className="grid gap-4 md:grid-cols-2">
                <Input label="Login ID" value={companyForm.login_id} onChange={(e) => setCompanyForm({ ...companyForm, login_id: e.target.value })} required />
                <Input label="Mật khẩu" type="password" value={companyForm.password} onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })} required />
                <Input label="Mã công ty" value={companyForm.company_cd} onChange={(e) => setCompanyForm({ ...companyForm, company_cd: e.target.value })} />
                <Input label="Tên công ty" value={companyForm.company_name} onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })} required />
                <Input label="Người liên hệ" value={companyForm.contact_name} onChange={(e) => setCompanyForm({ ...companyForm, contact_name: e.target.value })} />
                <Input label="Email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
                <div className="md:col-span-2">
                  <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Tạo Công ty VN"}</Button>
                </div>
              </form>
            </Card>
          )}

          {error && <p className="text-sm text-red-600">{translateMessage(error)}</p>}

          <Card>
            {loading ? (
              <p className="text-sm text-gray-500">Đang tải...</p>
            ) : roleTab === "admin" ? (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Login</Th>
                    <Th>Họ tên</Th>
                    <Th>Email</Th>
                    <Th>Trạng thái</Th>
                    <Th />
                  </Tr>
                </Thead>
                <tbody>
                  {admins.map((u) => (
                    <Tr key={u.id}>
                      <Td>{u.login_id}</Td>
                      <Td>{u.full_name}</Td>
                      <Td>{u.email ?? "—"}</Td>
                      <Td>
                        <Badge variant={u.disabled_flag ? "danger" : "success"}>
                          {u.disabled_flag ? "Tắt" : "Hoạt động"}
                        </Badge>
                      </Td>
                      <Td>
                        <Button variant="secondary" size="sm" onClick={() => toggleAdmin(u.id)}>
                          {u.disabled_flag ? "Bật" : "Tắt"}
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Login</Th>
                    <Th>Mã CT</Th>
                    <Th>Tên công ty</Th>
                    <Th>Liên hệ</Th>
                    <Th>Trạng thái</Th>
                    <Th />
                  </Tr>
                </Thead>
                <tbody>
                  {companies.map((u) => (
                    <Tr key={u.id}>
                      <Td>{u.login_id}</Td>
                      <Td>{u.company_cd ?? "—"}</Td>
                      <Td>{u.company_name}</Td>
                      <Td>{u.contact_name ?? "—"}</Td>
                      <Td>
                        <Badge variant={u.disabled_flag ? "danger" : "success"}>
                          {u.disabled_flag ? "Tắt" : "Hoạt động"}
                        </Badge>
                      </Td>
                      <Td>
                        <Button variant="secondary" size="sm" onClick={() => toggleCompany(u.id)}>
                          {u.disabled_flag ? "Bật" : "Tắt"}
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <p className="text-xs text-text-muted">
            User chi nhánh: tạo tại menu <strong>Chi Nhánh</strong> → Nhân viên. Menu Đại lý (`/agents`) chưa triển khai — dùng tab Công ty VN ở trên.
          </p>
        </>
      )}

      {tab === "permissions" && (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-sm text-text-muted">Ma trận phân quyền chi tiết sẽ có khi REQ-003 hoàn chỉnh</p>
        </Card>
      )}
    </div>
  );
}
