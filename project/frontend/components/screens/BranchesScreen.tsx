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
import {
  clearFieldError,
  hasFieldErrors,
  validateBranchForm,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import type { BranchItem } from "@/types/api";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

const REGIONS = ["Bắc", "Trung", "Nam"];

export function BranchesScreen() {
  const [items, setItems] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    branch_cd: "",
    branch_name: "",
    region: "Bắc",
    province: "",
    address: "",
    tel: "",
  });

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/branches");
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
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  function patchForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => clearFieldError(prev, key));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const errors = validateBranchForm(form);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/branches", {
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
      setForm({
        branch_cd: "",
        branch_name: "",
        region: "Bắc",
        province: "",
        address: "",
        tel: "",
      });
      await loadBranches();
    } catch {
      setError("API_OFFLINE");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBranch(id: number) {
    const res = await fetch(`/api/proxy/branches/${id}/toggle`, { method: "PUT" });
    const data = await res.json();
    if (data.success) await loadBranches();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Chi Nhánh"
        subtitle="Tạo và quản lý chi nhánh độc lập trên toàn quốc."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Đóng form" : "+ Tạo chi nhánh"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mã chi nhánh"
              value={form.branch_cd}
              onChange={(e) => patchForm("branch_cd", e.target.value)}
              required
              error={fieldErrors.branch_cd}
            />
            <Input
              label="Tên chi nhánh"
              value={form.branch_name}
              onChange={(e) => patchForm("branch_name", e.target.value)}
              required
              error={fieldErrors.branch_name}
            />
            <Select
              label="Miền"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              options={REGIONS.map((r) => ({ value: r, label: r }))}
            />
            <Input
              label="Tỉnh/Thành"
              value={form.province}
              onChange={(e) => patchForm("province", e.target.value)}
              required
              error={fieldErrors.province}
            />
            <Input
              label="Địa chỉ"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Điện thoại"
              value={form.tel}
              onChange={(e) => setForm({ ...form, tel: e.target.value })}
            />
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu chi nhánh"}
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
                <Th>Mã</Th>
                <Th>Tên</Th>
                <Th>Miền</Th>
                <Th>Tỉnh/TP</Th>
                <Th>Trạng thái</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {items.map((b) => (
                <Tr key={b.id}>
                  <Td>{b.branch_cd}</Td>
                  <Td>{b.branch_name}</Td>
                  <Td>{b.region}</Td>
                  <Td>{b.province}</Td>
                  <Td>
                    <Badge variant={b.disabled_flag ? "danger" : "success"}>
                      {b.disabled_flag ? "Tắt" : "Hoạt động"}
                    </Badge>
                  </Td>
                  <Td className="space-x-2">
                    <Link href={`/admin/branches/${b.id}/users`}>
                      <Button variant="secondary" size="sm">
                        Nhân viên
                      </Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => toggleBranch(b.id)}>
                      {b.disabled_flag ? "Bật" : "Tắt"}
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
