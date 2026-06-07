"use client";

import {
  Badge,
  Button,
  Card,
  PageHeader,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import type { CompanyUserItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function AgentsScreen() {
  const isAdmin = useIsAdmin();
  const [items, setItems] = useState<CompanyUserItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        subtitle="Danh sách công ty VN (đại lý B2B) — tài khoản đặt hàng"
        actions={
          <Link href="/admin">
            <Button size="sm">+ Tạo đại lý tại Quản trị</Button>
          </Link>
        }
      />

      <Card>
        {loading ? (
          <p className="text-sm text-text-muted p-4">Đang tải...</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Login</Th>
                <Th>Mã</Th>
                <Th>Tên công ty</Th>
                <Th>Liên hệ</Th>
                <Th>Trạng thái</Th>
              </Tr>
            </Thead>
            <tbody>
              {items.map((c) => (
                <Tr key={c.id}>
                  <Td>{c.login_id}</Td>
                  <Td>{c.company_cd ?? "—"}</Td>
                  <Td>{c.company_name}</Td>
                  <Td>{c.contact_name ?? "—"}</Td>
                  <Td>
                    <Badge variant={c.disabled_flag ? "danger" : "success"}>
                      {c.disabled_flag ? "Tắt" : "Hoạt động"}
                    </Badge>
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
