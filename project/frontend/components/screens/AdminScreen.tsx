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
import {
  getMenusForRole,
  getPermissionMatrix,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  roleBadgeVariant,
} from "@/lib/roleAccess";
import { translateMessage } from "@/lib/messages";
import type {
  AdminUserItem,
  BranchItem,
  BranchUserItem,
  CompanyUserItem,
  UserType,
} from "@/types/api";
import Link from "next/link";
import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from "react";

type UserRoleTab = "all" | "admin" | "company" | "branch";
type CreateRole = "admin" | "company";

interface UnifiedUserRow {
  key: string;
  id: number;
  login_id: string;
  display_name: string;
  email?: string | null;
  org?: string;
  user_type: UserType;
  menus: string[];
  disabled_flag: boolean;
  source: "admin" | "company" | "branch";
  branch_id?: number;
}

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

function matchesSearch(...parts: (string | null | undefined)[]) {
  return (q: string) => {
    const lower = q.toLowerCase();
    return parts.some((p) => (p ?? "").toLowerCase().includes(lower));
  };
}

function FormLegend() {
  return (
    <p className="text-xs text-text-muted mb-4 pb-3 border-b border-border">
      <span className="text-danger font-medium">*</span> Trường bắt buộc · Mật khẩu tối thiểu 8 ký tự
    </p>
  );
}

function MenuBadges({ menus, max = 4 }: { menus: string[]; max?: number }) {
  const shown = menus.slice(0, max);
  const rest = menus.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1 max-w-xs">
      {shown.map((m) => (
        <Badge key={m} variant="gray" className="text-[10px]">
          {m}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="info" className="text-[10px]">
          +{rest}
        </Badge>
      )}
    </div>
  );
}

export function AdminScreen() {
  const [tab, setTab] = useState<"users" | "permissions">("users");
  const [roleTab, setRoleTab] = useState<UserRoleTab>("all");
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [companies, setCompanies] = useState<CompanyUserItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [branchUsers, setBranchUsers] = useState<BranchUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [createRole, setCreateRole] = useState<CreateRole>("admin");
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
      const nextAdmins = aData.success && aData.data?.items ? aData.data.items : [];
      const nextCompanies = cData.success && cData.data?.items ? cData.data.items : [];
      const nextBranches = bData.success && bData.data?.items ? bData.data.items : [];

      if (!aData.success) err = formatApiError(aData);
      if (!cData.success) err = err || formatApiError(cData);

      setAdmins(nextAdmins);
      setCompanies(nextCompanies);
      setBranches(nextBranches);

      const branchLists = await Promise.all(
        nextBranches.map(async (b: BranchItem) => {
          try {
            const res = await fetch(`/api/proxy/branches/${b.id}/users`);
            const data = await res.json();
            const users: BranchUserItem[] = data.success && data.data?.items ? data.data.items : [];
            return users;
          } catch {
            return [];
          }
        }),
      );
      setBranchUsers(branchLists.flat());

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

  const unifiedUsers = useMemo((): UnifiedUserRow[] => {
    const rows: UnifiedUserRow[] = [];

    for (const u of admins) {
      rows.push({
        key: `admin-${u.id}`,
        id: u.id,
        login_id: u.login_id,
        display_name: u.full_name,
        email: u.email,
        org: "JP Agency",
        user_type: "admin",
        menus: getMenusForRole("admin"),
        disabled_flag: u.disabled_flag,
        source: "admin",
      });
    }

    for (const u of companies) {
      rows.push({
        key: `company-${u.id}`,
        id: u.id,
        login_id: u.login_id,
        display_name: u.company_name,
        email: u.email,
        org: u.contact_name ?? u.company_cd ?? undefined,
        user_type: "company",
        menus: getMenusForRole("company"),
        disabled_flag: u.disabled_flag,
        source: "company",
      });
    }

    for (const u of branchUsers) {
      const branch = branches.find((b) => b.id === u.branch_id);
      rows.push({
        key: `branch-${u.branch_id}-${u.id}`,
        id: u.id,
        login_id: u.login_id,
        display_name: u.full_name,
        email: u.email,
        org: branch?.branch_name ?? `CN #${u.branch_id}`,
        user_type: u.user_type,
        menus: getMenusForRole(u.user_type),
        disabled_flag: u.disabled_flag,
        source: "branch",
        branch_id: u.branch_id,
      });
    }

    return rows.sort((a, b) => a.login_id.localeCompare(b.login_id));
  }, [admins, companies, branchUsers, branches]);

  const filteredUsers = useMemo(() => {
    const q = search.trim();
    return unifiedUsers.filter((u) => {
      if (roleTab === "admin" && u.source !== "admin") return false;
      if (roleTab === "company" && u.source !== "company") return false;
      if (roleTab === "branch" && u.source !== "branch") return false;
      if (!q) return true;
      const match = matchesSearch(u.login_id, u.display_name, u.email, u.org);
      return match(q);
    });
  }, [unifiedUsers, roleTab, search]);

  const stats = useMemo(
    () => ({
      total: unifiedUsers.length,
      admin: unifiedUsers.filter((u) => u.source === "admin").length,
      company: unifiedUsers.filter((u) => u.source === "company").length,
      branch: unifiedUsers.filter((u) => u.source === "branch").length,
    }),
    [unifiedUsers],
  );

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

  async function toggleUser(row: UnifiedUserRow) {
    let url = "";
    if (row.source === "admin") url = `/api/proxy/admin-users/${row.id}/toggle`;
    else if (row.source === "company") url = `/api/proxy/company-users/${row.id}/toggle`;
    else if (row.branch_id) url = `/api/proxy/branches/${row.branch_id}/users/${row.id}/toggle`;

    if (!url) return;

    const res = await fetch(url, { method: "PUT" });
    const data = await res.json();
    if (data.success) await loadUsers();
    else setError(formatApiError(data));
  }

  const permissionMatrix = getPermissionMatrix();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Trị Hệ Thống"
        subtitle="Danh sách toàn bộ người dùng · tạo tài khoản · xem quyền truy cập"
        actions={
          tab === "users" ? (
            <Button
              size="sm"
              onClick={() => {
                setShowForm((v) => !v);
                setSuccess("");
              }}
            >
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
            {t === "users" ? "👤 Người Dùng" : "🔐 Ma trận quyền"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tất cả", value: stats.total, tab: "all" as const },
              { label: "Admin", value: stats.admin, tab: "admin" as const },
              { label: "Công ty VN", value: stats.company, tab: "company" as const },
              { label: "Chi nhánh", value: stats.branch, tab: "branch" as const },
            ].map((s) => (
              <Card
                key={s.tab}
                className={`p-3 cursor-pointer transition-colors ${
                  roleTab === s.tab ? "border-brand ring-1 ring-brand/20" : "hover:border-brand/40"
                }`}
                onClick={() => {
                  setRoleTab(s.tab);
                  setSearch("");
                }}
              >
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className="text-xl font-semibold text-text-primary mt-0.5">{loading ? "…" : s.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm login, tên, email, công ty, chi nhánh..."
            />
            <p className="text-xs text-text-muted mt-2">
              {loading ? "Đang tải..." : `Hiển thị ${filteredUsers.length} / ${stats.total} người dùng`}
            </p>
          </Card>

          {showForm && (
            <Card className="p-5 border-l-4 border-l-brand">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm font-medium text-text-primary mr-2">Loại tài khoản:</span>
                {(
                  [
                    { id: "admin" as const, label: "🛡️ Admin (JP)" },
                    { id: "company" as const, label: "🏪 Công ty VN" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setCreateRole(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      createRole === r.id
                        ? "bg-brand text-white border-brand"
                        : "bg-white border-border text-text-muted hover:border-brand/50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
                <Link
                  href="/admin/branches"
                  className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-border text-text-muted hover:border-brand hover:text-brand"
                >
                  🏢 Chi nhánh → tạo tại menu Chi Nhánh
                </Link>
              </div>

              {createRole === "admin" ? (
                <>
                  <h3 className="text-base font-semibold text-text-primary mb-1">Tạo Admin (JP)</h3>
                  <p className="text-xs text-text-muted mb-4">{ROLE_DESCRIPTIONS.admin}</p>
                  <FormLegend />
                  <form onSubmit={handleCreateAdmin} className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Login ID"
                      hint="Dùng để đăng nhập, không trùng user khác"
                      value={adminForm.login_id}
                      onChange={(e) => setAdminForm({ ...adminForm, login_id: e.target.value })}
                      placeholder="vd: admin_jp02"
                      required
                    />
                    <Input
                      label="Mật khẩu"
                      hint="Tối thiểu 8 ký tự, nên có chữ hoa, số và ký tự đặc biệt"
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder="vd: Admin@123"
                      required
                      minLength={8}
                    />
                    <Input
                      label="Họ tên"
                      value={adminForm.full_name}
                      onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                    <Input
                      label="Email"
                      optional
                      hint="Nhận thông báo đơn hàng mới"
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      placeholder="admin@company.com"
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Đang lưu..." : "Tạo Admin"}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                        Hủy
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-text-primary mb-1">Tạo Công ty VN (đại lý)</h3>
                  <p className="text-xs text-text-muted mb-4">{ROLE_DESCRIPTIONS.company}</p>
                  <FormLegend />
                  <form onSubmit={handleCreateCompany} className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Login ID"
                      hint="Tài khoản đăng nhập của đại lý"
                      value={companyForm.login_id}
                      onChange={(e) => setCompanyForm({ ...companyForm, login_id: e.target.value })}
                      placeholder="vd: vn_company02"
                      required
                    />
                    <Input
                      label="Mật khẩu"
                      hint="Gửi cho đại lý qua kênh bảo mật"
                      type="password"
                      value={companyForm.password}
                      onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })}
                      placeholder="vd: Company@123"
                      required
                      minLength={8}
                    />
                    <Input
                      label="Mã công ty"
                      optional
                      hint="Mã nội bộ, vd: VN-HN-01"
                      value={companyForm.company_cd}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_cd: e.target.value })}
                      placeholder="VN001"
                    />
                    <Input
                      label="Tên công ty"
                      value={companyForm.company_name}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                      placeholder="Công ty TNHH ABC"
                      required
                    />
                    <Input
                      label="Người liên hệ"
                      optional
                      value={companyForm.contact_name}
                      onChange={(e) => setCompanyForm({ ...companyForm, contact_name: e.target.value })}
                      placeholder="Trần Thị B"
                    />
                    <Input
                      label="Email"
                      optional
                      hint="Nhận thông báo đơn / hóa đơn"
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      placeholder="contact@company.vn"
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Đang lưu..." : "Tạo Công ty VN"}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                        Hủy
                      </Button>
                    </div>
                  </form>
                </>
              )}
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
              <EmptyState message="Đang tải toàn bộ người dùng..." icon="⏳" />
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                message={search ? "Không tìm thấy người dùng phù hợp." : "Chưa có người dùng. Bấm + Thêm người dùng."}
                icon="👤"
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Login</Th>
                    <Th>Tên / Tổ chức</Th>
                    <Th>Vai trò</Th>
                    <Th>Quyền xem (menu)</Th>
                    <Th>TT</Th>
                    <Th />
                  </Tr>
                </Thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <Fragment key={u.key}>
                      <Tr
                        className="cursor-pointer hover:bg-surface-subtle/50"
                        onClick={() => setExpandedKey(expandedKey === u.key ? null : u.key)}
                      >
                        <Td className="font-medium">{u.login_id}</Td>
                        <Td>
                          <p className="text-sm">{u.display_name}</p>
                          {u.org && <p className="text-xs text-text-muted">{u.org}</p>}
                        </Td>
                        <Td>
                          <Badge variant={roleBadgeVariant(u.user_type)}>{ROLE_LABELS[u.user_type]}</Badge>
                        </Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <MenuBadges menus={u.menus} />
                        </Td>
                        <Td>
                          <Badge variant={u.disabled_flag ? "danger" : "success"}>
                            {u.disabled_flag ? "Tắt" : "ON"}
                          </Badge>
                        </Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="sm" onClick={() => toggleUser(u)}>
                            {u.disabled_flag ? "Bật" : "Tắt"}
                          </Button>
                        </Td>
                      </Tr>
                      {expandedKey === u.key && (
                        <Tr key={`${u.key}-detail`}>
                          <Td colSpan={6} className="bg-surface-subtle/30 py-4">
                            <div className="space-y-2 text-sm">
                              <p className="text-text-muted">
                                <strong>Email:</strong> {u.email ?? "—"} ·{" "}
                                <strong>Mô tả quyền:</strong> {ROLE_DESCRIPTIONS[u.user_type]}
                              </p>
                              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
                                Các màn hình được phép truy cập:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {u.menus.map((m) => (
                                  <Badge key={m} variant="info">
                                    {m}
                                  </Badge>
                                ))}
                              </div>
                              {u.source === "branch" && u.branch_id && (
                                <Link
                                  href={`/admin/branches/${u.branch_id}/users`}
                                  className="inline-block text-brand text-xs mt-2"
                                >
                                  Quản lý chi nhánh này →
                                </Link>
                              )}
                            </div>
                          </Td>
                        </Tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <p className="text-xs text-text-muted">
            Bấm vào một dòng để xem đầy đủ quyền menu. User chi nhánh mới:{" "}
            <Link href="/admin/branches" className="text-brand">
              Chi Nhánh
            </Link>{" "}
            → Quản lý NV.
          </p>
        </>
      )}

      {tab === "permissions" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-subtle/40">
            <h3 className="text-sm font-semibold text-text-primary">Ma trận quyền theo vai trò (menu hiển thị)</h3>
            <p className="text-xs text-text-muted mt-1">
              Dựa trên cấu hình hiện tại — chưa chỉnh từng user (REQ-003 sẽ mở rộng sau).
            </p>
          </div>
          <Table>
            <Thead>
              <Tr>
                <Th>Module</Th>
                <Th>Nhóm</Th>
                <Th className="text-center">Admin</Th>
                <Th className="text-center">Công ty</Th>
                <Th className="text-center">QL CN</Th>
                <Th className="text-center">NV CN</Th>
              </Tr>
            </Thead>
            <tbody>
              {permissionMatrix.map((row) => (
                <Tr key={row.module}>
                  <Td className="font-medium">{row.module}</Td>
                  <Td className="text-xs text-text-muted">{row.group ?? "—"}</Td>
                  {(["admin", "company", "branch_manager", "branch_staff"] as UserType[]).map((role) => (
                    <Td key={role} className="text-center">
                      {row.access[role] ? (
                        <span className="text-success" title="Được phép">
                          ✓
                        </span>
                      ) : (
                        <span className="text-text-placeholder">—</span>
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
