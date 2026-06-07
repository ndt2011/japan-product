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

const demoSuppliers = [
  { id: "NCC-001", name: "Công Ty TNHH Otsuka Pharma JP", contact: "Tanaka Hiroshi", phone: "03-1234-5678", email: "tanaka@otsuka.jp", status: "active", totalOrders: 124, totalValue: "2.4 tỷ" },
  { id: "NCC-002", name: "DHC Corporation", contact: "Suzuki Yuki", phone: "03-9876-5432", email: "suzuki@dhc.co.jp", status: "active", totalOrders: 89, totalValue: "1.8 tỷ" },
  { id: "NCC-003", name: "Fancl International", contact: "Watanabe Ken", phone: "06-5555-1234", email: "watanabe@fancl.com", status: "active", totalOrders: 56, totalValue: "980 tr" },
  { id: "NCC-004", name: "Kobayashi Pharmaceutical", contact: "Ito Mai", phone: "06-7777-8888", email: "ito@kobayashi.co.jp", status: "inactive", totalOrders: 34, totalValue: "620 tr" },
  { id: "NCC-005", name: "Suntory Wellness", contact: "Nakamura Rei", phone: "03-2222-3333", email: "nakamura@suntory.co.jp", status: "active", totalOrders: 72, totalValue: "1.5 tỷ" },
];

export function SuppliersScreen() {
  const [search, setSearch] = useState("");

  const filtered = demoSuppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nhà Cung Cấp"
        subtitle={`${demoSuppliers.length} nhà cung cấp · Dữ liệu demo`}
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
        <SearchInput placeholder="Tìm theo mã, tên, liên hệ..." value={search} onChange={setSearch} />
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Mã NCC</Th>
              <Th>Tên Nhà Cung Cấp</Th>
              <Th>Người Liên Hệ</Th>
              <Th>Điện Thoại</Th>
              <Th>Email</Th>
              <Th>Đơn Hàng</Th>
              <Th>Giá Trị</Th>
              <Th>Trạng thái</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((s) => (
              <Tr key={s.id}>
                <Td className="font-medium">{s.id}</Td>
                <Td>{s.name}</Td>
                <Td>{s.contact}</Td>
                <Td>{s.phone}</Td>
                <Td className="text-text-muted">{s.email}</Td>
                <Td>{s.totalOrders}</Td>
                <Td>{s.totalValue}</Td>
                <Td>
                  <Badge variant={s.status === "active" ? "success" : "gray"}>
                    {s.status === "active" ? "Hoạt động" : "Ngừng"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
