"use client";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { AdminUserItem, BranchItem, CompanyUserItem } from "@/types/api";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type UserRoleTab = "admin" | "company" | "branch";

function formatApiError(data: {
  message?: string;
  errors?: Record<string, string[]> | null;
}): string {
  if (data.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  return translateMessage(data.message ?? "M0001");
}

function matchesSearch(text: string, q: string) {
  return text.toLowerCase().includes(q.toLowerCase());
}

export function AdminScreen() {
  const [tab, setTab] = useState<"users" | "permissions">("users");
  const [roleTab, setRoleTab] = useState<UserRoleTab>("admin");
  const [search, setSearch] = useState("");
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [companies, setCompanies] = useState<CompanyUserItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      const [aRes, cRes, bRes] = await Promise.all([
        fetch("/api/proxy/admin-users"),
        fetch("/api/proxy/company-users"),
        fetch("/api/proxy/branches"),
      ]);
      const aData = await aRes.json();
      const cData = await cRes.json();
      const bData = await bRes.json();

      let err = "";
      if (aData.success && aData.data?.items) setAdmins(aData.data.items);
      else if (!aData.success) err = formatApiError(aData);

      if (cData.success && cData.data?.items) setCompanies(cData.data.items);
      else if (!cData.success) err = err || formatApiError(cData);

      if (bData.success && bData.data?.items) setBranches(bData.data.items);

      if (err) setError(err);
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab, loadUsers]);

  const filteredAdmins = useMemo(() => {
    const q = search.trim();
    if (!q) return admins;
    return admins.filter(
      (u) =>
        matchesSearch(u.login_id, q) ||
        matchesSearch(u.full_name, q) ||
        matchesSearch(u.email ?? "", q),
    );
  }, [admins, search]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim();
    if (!q) return companies;
    return companies.filter(
      (u) =>
        matchesSearch(u.login_id, q) ||
        matchesSearch(u.company_name, q) ||
        matchesSearch(u.company_cd ?? "", q) ||
        matchesSearch(u.contact_name ?? "", q),
    );
  }, [companies, search]);

  const filteredBranches = useMemo(() => {
    const q = search.trim();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        matchesSearch(b.branch_cd, q) ||
        matchesSearch(b.branch_name, q) ||
        matchesSearch(b.province, q),
    );
  }, [branches, search]);

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/proxy/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!data.success) {
        setError(formatApiError(data));
        return;
      }
      setSuccess(translateMessage("M0110"));
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
    setSuccess("");
    try {
      const res = await fetch("/api/proxy/company-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyForm),
      });
      const data = await res.json();
      if (!data.success) {
        setError(formatApiError(data));
        return;
      }
      setSuccess(translateMessage("M0111"));
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
    else setError(formatApiError(data));
  }

  async function toggleCompany(id: number) {
    const res = await fetch(`/api/proxy/company-users/${id}/toggle`, { method: "PUT" });
    const data = await res.json();
    if (data.success) await loadUsers();
    else setError(formatApiError(data));
  }

  const listCount =
    roleTab === "admin"
      ? filteredAdmins.length
      : roleTab === "company"
        ? filteredCompanies.length
        : filteredBranches.length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Trị Hệ Thống"
        subtitle="Quản lý người dùng và phân quyền theo vai trò"
        actions={
          tab === "users" && roleTab !== "branch" ? (
            <Button size="sm" onClick={() => { setShowForm((v) => !v); setSuccess(""); }}>
              {showForm ? "Đóng form" : "+ Thêm người dùng"}
            </Button>
          ) : roleTab === "branch" ? (
            <Link href="/admin/branches">
              <Button size="sm">+ Tạo chi nhánh</Button>
            </Link>
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
          <div className="flex flex-wrap gap-2 items-center">
            {(
              [
                { id: "admin" as const, label: "Admin (JP)", icon: "🛡️" },
                { id: "company" as const, label: "Công ty VN / Đại lý", icon: "🏪" },
                { id: "branch" as const, label: "Chi nhánh", icon: "🏢" },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRoleTab(r.id);
                  setShowForm(false);
                  setSearch("");
                  setSuccess("");
                }}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  roleTab === r.id ? "bg-brand/10 text-brand font-medium" : "text-text-muted hover:text-text-body"
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          <Card className="p-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={
                roleTab === "admin"
                  ? "Tìm login, họ tên, email..."
                  : roleTab === "company"
                    ? "Tìm login, tên công ty, mã CT..."
                    : "Tìm mã CN, tên chi nhánh, tỉnh..."
              }
            />
            <p className="text-xs text-text-muted mt-2">
              {loading ? "Đang tải..." : `${listCount} bản ghi`}
              {roleTab === "branch" && " — nhân viên CN tạo trong từng chi nhánh"}
            </p>
          </Card>

          {showForm && roleTab === "admin" && (
            <Card>
              <p className="text-sm font-medium text-text-primary mb-3">Tạo tài khoản Admin (JP)</p>
              <form onSubmit={handleCreateAdmin} className="grid gap-4 md:grid-cols-2">
                <Input label="Login ID" value={adminForm.login_id} onChange={(e) => setAdminForm({ ...adminForm, login_id: e.target.value })} required />
                <Input label="Mật khẩu (tối thiểu 8 ký tự)" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} required minLength={8} />
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
              <p className="text-sm font-medium text-text-primary mb-3">Tạo tài khoản Công ty VN (đại lý B2B)</p>
              <form onSubmit={handleCreateCompany} className="grid gap-4 md:grid-cols-2">
                <Input label="Login ID" value={companyForm.login_id} onChange={(e) => setCompanyForm({ ...companyForm, login_id: e.target.value })} required />
                <Input label="Mật khẩu (tối thiểu 8 ký tự)" type="password" value={companyForm.password} onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })} required minLength={8} />
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

          {error && (
            <Card className="p-3 border-danger/30 bg-danger/5">
              <p className="text-sm text-danger">{translateMessage(error) === error ? error : translateMessage(error)}</p>
            </Card>
          )}
          {success && (
            <Card className="p-3 border-green-200 bg-green-50">
              <p className="text-sm text-green-700">{success}</p>
            </Card>
          )}

          <Card>
            {loading ? (
              <EmptyState message="Đang tải danh sách người dùng..." icon="⏳" />
            ) : roleTab === "admin" ? (
              filteredAdmins.length === 0 ? (
                <EmptyState
                  message={search ? "Không tìm thấy admin phù hợp." : "Chưa có admin. Bấm + Thêm người dùng để tạo."}
                  icon="👤"
                />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Login</Th>
                      <Th>Họ tên</Th>
                      <Th>Email</Th>
                      <Th>Vai trò</Th>
                      <Th>Trạng thái</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <tbody>
                    {filteredAdmins.map((u) => (
                      <Tr key={u.id}>
                        <Td className="font-medium">{u.login_id}</Td>
                        <Td>{u.full_name}</Td>
                        <Td>{u.email ?? "—"}</Td>
                        <Td><Badge variant="primary">Admin</Badge></Td>
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
              )
            ) : roleTab === "company" ? (
              filteredCompanies.length === 0 ? (
                <EmptyState
                  message={search ? "Không tìm thấy công ty phù hợp." : "Chưa có công ty VN. Bấm + Thêm người dùng để tạo đại lý."}
                  icon="🏪"
                />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Login</Th>
                      <Th>Mã CT</Th>
                      <Th>Tên công ty</Th>
                      <Th>Liên hệ</Th>
                      <Th>Vai trò</Th>
                      <Th>Trạng thái</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <tbody>
                    {filteredCompanies.map((u) => (
                      <Tr key={u.id}>
                        <Td className="font-medium">{u.login_id}</Td>
                        <Td>{u.company_cd ?? "—"}</Td>
                        <Td>{u.company_name}</Td>
                        <Td>{u.contact_name ?? "—"}</Td>
                        <Td><Badge variant="warning">Công ty VN</Badge></Td>
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
              )
            ) : filteredBranches.length === 0 ? (
              <EmptyState
                message={search ? "Không tìm thấy chi nhánh." : "Chưa có chi nhánh. Tạo chi nhánh trước, sau đó thêm manager/staff."}
                icon="🏢"
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Mã CN</Th>
                    <Th>Tên chi nhánh</Th>
                    <Th>Khu vực</Th>
                    <Th>Nhân viên</Th>
                    <Th>Trạng thái</Th>
                    <Th />
                  </Tr>
                </Thead>
                <tbody>
                  {filteredBranches.map((b) => (
                    <Tr key={b.id}>
                      <Td className="font-medium">{b.branch_cd}</Td>
                      <Td>{b.branch_name}</Td>
                      <Td>{b.region} · {b.province}</Td>
                      <Td>{b.users_count ?? 0}</Td>
                      <Td>
                        <Badge variant={b.disabled_flag ? "danger" : "success"}>
                          {b.disabled_flag ? "Tắt" : "Hoạt động"}
                        </Badge>
                      </Td>
                      <Td>
                        <Link href={`/admin/branches/${b.id}/users`} className="text-brand text-sm">
                          Quản lý NV →
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
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
