"use client";

import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Modal,
  ModalFooter,
  PageHeader,
  SearchInput,
  Select,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { Building2, Edit2, Plus, Trash2 } from "lucide-react";
import {
  clearFieldError,
  hasFieldErrors,
  validateSupplierForm,
  type FieldErrors,
} from "@/lib/form-validation";
import { useIsAdmin } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

interface SupplierRow {
  id: number;
  supplier_cd: string;
  supplier_name: string;
  supplier_name_jp?: string | null;
  address?: string | null;
  tel?: string | null;
  email?: string | null;
  contact_name?: string | null;
  disabled_flag?: boolean;
  memo?: string | null;
}

const EMPTY_FORM = {
  supplier_cd: "",
  supplier_name: "",
  supplier_name_jp: "",
  contact_name: "",
  tel: "",
  email: "",
  address: "",
  memo: "",
  status: "active",
};

export function SuppliersScreen() {
  const isAdmin = useIsAdmin();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SupplierRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<SupplierRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = isAdmin ? "?detail=1&include_disabled=1" : "";
      const res = await fetch(`/api/proxy/suppliers${qs}`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setSuppliers(data.data.items);
      } else {
        setError(data.message ?? "Không tải được dữ liệu");
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const stats = useMemo(() => {
    const active = suppliers.filter((s) => !s.disabled_flag).length;
    return { total: suppliers.length, active, inactive: suppliers.length - active };
  }, [suppliers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      const matchSearch =
        !q ||
        s.supplier_name.toLowerCase().includes(q) ||
        s.supplier_cd.toLowerCase().includes(q) ||
        (s.supplier_name_jp ?? "").toLowerCase().includes(q) ||
        (s.contact_name ?? "").toLowerCase().includes(q);
      const matchStatus =
        !statusFilter ||
        (statusFilter === "active" ? !s.disabled_flag : !!s.disabled_flag);
      return matchSearch && matchStatus;
    });
  }, [suppliers, search, statusFilter]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
  }

  function openAdd() {
    setEditItem(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(s: SupplierRow) {
    setEditItem(s);
    setForm({
      supplier_cd: s.supplier_cd ?? "",
      supplier_name: s.supplier_name,
      supplier_name_jp: s.supplier_name_jp ?? "",
      contact_name: s.contact_name ?? "",
      tel: s.tel ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      memo: s.memo ?? "",
      status: s.disabled_flag ? "inactive" : "active",
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditItem(null);
    resetForm();
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const errors = validateSupplierForm(form);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;

    const payload = {
      supplier_cd: form.supplier_cd.trim() || undefined,
      supplier_name: form.supplier_name.trim(),
      supplier_name_jp: form.supplier_name_jp.trim() || undefined,
      contact_name: form.contact_name.trim() || undefined,
      tel: form.tel.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      memo: form.memo.trim() || undefined,
      ...(editItem ? { disabled_flag: form.status === "inactive" } : {}),
    };

    setSaving(true);
    try {
      const res = await fetch(
        editItem ? `/api/proxy/suppliers/${editItem.id}` : "/api/proxy/suppliers",
        {
          method: editItem ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!data.success) {
        toast.error(translateMessage(data.message ?? "M0001"));
        return;
      }
      toast.success(editItem ? "Đã cập nhật nhà cung cấp." : "Đã thêm nhà cung cấp.");
      closeModal();
      await loadSuppliers();
    } catch {
      toast.error("Không thể lưu nhà cung cấp.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/suppliers/${deleteItem.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(translateMessage(data.message ?? "M0001"));
        return;
      }
      toast.success("Đã xóa nhà cung cấp.");
      setDeleteItem(null);
      await loadSuppliers();
    } catch {
      toast.error("Không thể xóa nhà cung cấp.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nhà Cung Cấp"
        subtitle={loading ? "Đang tải..." : `${suppliers.length} nhà cung cấp`}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled>
              📤 Xuất Excel
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4" />
                Thêm NCC
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Tổng NCC", value: stats.total, color: "text-brand" },
          { label: "Hoạt Động", value: stats.active, color: "text-success" },
          { label: "Ngừng", value: stats.inactive, color: "text-text-muted" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-xl mt-1 font-semibold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            placeholder="Tìm theo mã, tên, liên hệ..."
            value={search}
            onChange={setSearch}
            className="flex-1 min-w-52"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng</option>
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải danh sách nhà cung cấp..." icon="⏳" />
        ) : error ? (
          <EmptyState message="Chưa kết nối được API hoặc chưa đăng nhập." icon="⚠️" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Không tìm thấy nhà cung cấp." icon="🏭" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Mã NCC</Th>
                <Th>Tên Nhà Cung Cấp</Th>
                <Th>Người Liên Hệ</Th>
                <Th>Điện Thoại</Th>
                <Th>Email</Th>
                <Th>Trạng Thái</Th>
                {isAdmin && <Th>Thao Tác</Th>}
              </tr>
            </Thead>
            <tbody>
              {filtered.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <span className="text-brand font-medium text-xs">{s.supplier_cd}</span>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs font-medium">{s.supplier_name}</p>
                      {(s.address || s.supplier_name_jp) && (
                        <p className="text-xs text-text-muted truncate max-w-[200px]">
                          {s.address ?? s.supplier_name_jp}
                        </p>
                      )}
                    </div>
                  </Td>
                  <Td className="text-xs">{s.contact_name ?? "—"}</Td>
                  <Td className="text-xs">{s.tel ?? "—"}</Td>
                  <Td className="text-xs text-brand">{s.email ?? "—"}</Td>
                  <Td>
                    <Badge variant={s.disabled_flag ? "gray" : "success"}>
                      {s.disabled_flag ? "Ngừng" : "Hoạt động"}
                    </Badge>
                  </Td>
                  {isAdmin && (
                    <Td>
                      <div className="flex items-center gap-1">
                        <IconButton variant="primary" onClick={() => openEdit(s)} title="Sửa">
                          <Edit2 className="w-3.5 h-3.5" />
                        </IconButton>
                        <IconButton variant="danger" onClick={() => setDeleteItem(s)} title="Xóa">
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-surface-subtle">
            <span className="text-xs text-text-muted">
              Hiển thị {filtered.length} / {suppliers.length} kết quả
            </span>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editItem ? "Chỉnh Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
        headerIcon={<Building2 className="w-4 h-4" />}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <Input
            label="Tên Nhà Cung Cấp *"
            value={form.supplier_name}
            onChange={(e) => {
              setForm((f) => ({ ...f, supplier_name: e.target.value }));
              setFieldErrors((prev) => clearFieldError(prev, "supplier_name"));
            }}
            error={fieldErrors.supplier_name}
            placeholder="Nhập tên nhà cung cấp"
          />
          <Input
            label="Tên (JP)"
            value={form.supplier_name_jp}
            onChange={(e) => setForm((f) => ({ ...f, supplier_name_jp: e.target.value }))}
            placeholder="Tên tiếng Nhật (tùy chọn)"
          />
          <Input
            label="Mã NCC"
            value={form.supplier_cd}
            onChange={(e) => setForm((f) => ({ ...f, supplier_cd: e.target.value }))}
            placeholder="Tự sinh nếu để trống"
            disabled={!!editItem}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Người Liên Hệ"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
            />
            <Input
              label="Số Điện Thoại"
              value={form.tel}
              onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Địa Chỉ"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          {editItem && (
            <Select
              label="Trạng Thái"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Ngừng hoạt động" },
              ]}
            />
          )}
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : editItem ? "Cập Nhật" : "Thêm Mới"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Xác Nhận Xóa"
        message="Bạn có chắc muốn xóa nhà cung cấp này không?"
        confirmLabel="Xóa"
        loading={deleting}
        detail={
          deleteItem ? (
            <p className="text-sm text-text-primary mt-2 font-medium">{deleteItem.supplier_name}</p>
          ) : undefined
        }
      />
    </div>
  );
}
