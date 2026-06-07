"use client";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SearchInput,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useCallback, useEffect, useState } from "react";

interface SupplierRow {
  id: number;
  supplier_cd: string;
  supplier_name: string;
  supplier_name_jp?: string | null;
}

export function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/suppliers");
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
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filtered = suppliers.filter(
    (s) =>
      s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier_cd.toLowerCase().includes(search.toLowerCase()) ||
      (s.supplier_name_jp ?? "").toLowerCase().includes(search.toLowerCase()),
  );

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
            <Button size="sm" disabled>
              + Thêm NCC
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <SearchInput placeholder="Tìm theo mã, tên..." value={search} onChange={setSearch} />
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải danh sách nhà cung cấp..." icon="⏳" />
        ) : error ? (
          <EmptyState message="Chưa kết nối được API hoặc chưa đăng nhập." icon="⚠️" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Chưa có nhà cung cấp. Thêm qua màn Sản phẩm hoặc API master data." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Mã NCC</Th>
                <Th>Tên Nhà Cung Cấp</Th>
                <Th>Tên (JP)</Th>
                <Th>Trạng thái</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.supplier_cd}</Td>
                  <Td>{s.supplier_name}</Td>
                  <Td className="text-text-muted">{s.supplier_name_jp ?? "—"}</Td>
                  <Td>
                    <Badge variant="success">Hoạt động</Badge>
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
