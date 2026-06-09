"use client";

import {
  Badge,
  Button,
  Card,
  DetailField,
  DetailGrid,
  EmptyState,
  IconButton,
  Modal,
  ModalFooter,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { Eye, Settings, Store } from "lucide-react";
import { useIsAdmin } from "@/hooks/usePermission";
import type { CompanyUserItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export function AgentsScreen() {
  const isAdmin = useIsAdmin();
  const [items, setItems] = useState<CompanyUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<CompanyUserItem | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/company-users");
      const data = await res.json();
      if (data.success && data.data?.items) {
        setItems(data.data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = items.filter((a) => !a.disabled_flag).length;
    return { total: items.length, active, inactive: items.length - active };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => {
      const matchSearch =
        !q ||
        a.company_name.toLowerCase().includes(q) ||
        a.login_id.toLowerCase().includes(q) ||
        (a.company_cd ?? "").toLowerCase().includes(q) ||
        (a.contact_name ?? "").toLowerCase().includes(q);
      const matchStatus =
        !statusFilter ||
        (statusFilter === "active" ? !a.disabled_flag : !!a.disabled_flag);
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-text-muted">Chỉ Admin xem danh sách đại lý / công ty VN.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Lý Đại Lý"
        subtitle={`${items.length} đại lý`}
        actions={
          <Link href="/admin">
            <Button size="sm">+ Tạo đại lý tại Quản trị</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Tổng Đại Lý", value: stats.total, color: "text-brand" },
          { label: "Đang Hoạt Động", value: stats.active, color: "text-success" },
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
            placeholder="Tìm đại lý, mã, login..."
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
          <EmptyState message="Đang tải..." icon="⏳" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Không tìm thấy đại lý." icon="🏪" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Mã ĐL</Th>
                <Th>Tên Đại Lý</Th>
                <Th>Login</Th>
                <Th>Người Liên Hệ</Th>
                <Th>Email</Th>
                <Th>Trạng Thái</Th>
                <Th>Thao Tác</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <span className="text-brand font-medium text-xs">{c.company_cd ?? "—"}</span>
                  </Td>
                  <Td className="text-xs font-medium">{c.company_name}</Td>
                  <Td className="text-xs font-mono">{c.login_id}</Td>
                  <Td className="text-xs">{c.contact_name ?? "—"}</Td>
                  <Td className="text-xs text-brand">{c.email ?? "—"}</Td>
                  <Td>
                    <Badge variant={c.disabled_flag ? "gray" : "success"}>
                      {c.disabled_flag ? "Ngừng" : "Hoạt động"}
                    </Badge>
                  </Td>
                  <Td>
                    <IconButton
                      variant="primary"
                      title="Chi tiết"
                      onClick={() => {
                        setSelected(c);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </IconButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-surface-subtle">
            <span className="text-xs text-text-muted">
              Hiển thị {filtered.length} / {items.length} kết quả
            </span>
          </div>
        )}
      </Card>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Chi Tiết Đại Lý — ${selected?.company_name ?? ""}`}
        headerIcon={<Store className="w-4 h-4" />}
        size="md"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>
              Đóng
            </Button>
            <Link href="/admin">
              <Button>
                <Settings className="w-4 h-4" />
                Quản trị tài khoản
              </Button>
            </Link>
          </ModalFooter>
        }
      >
        {selected && (
          <DetailGrid>
            <DetailField label="Mã công ty">{selected.company_cd ?? "—"}</DetailField>
            <DetailField label="Trạng thái">
              <Badge variant={selected.disabled_flag ? "gray" : "success"}>
                {selected.disabled_flag ? "Ngừng" : "Hoạt động"}
              </Badge>
            </DetailField>
            <DetailField label="Login">
              <span className="font-mono">{selected.login_id}</span>
            </DetailField>
            <DetailField label="Người liên hệ">{selected.contact_name ?? "—"}</DetailField>
            <DetailField label="Email" span={2}>
              {selected.email ?? "—"}
            </DetailField>
          </DetailGrid>
        )}
      </Modal>
    </div>
  );
}
