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
import type { ProductItem } from "@/types/api";
import { useEffect, useState } from "react";

export function ProductsScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/proxy/products");
        const data = await res.json();
        if (data.success && data.data?.items) {
          setProducts(data.data.items);
        } else {
          setError(data.message ?? "Không tải được dữ liệu");
        }
      } catch {
        setError("API_OFFLINE");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.product_cd ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Lý Hàng Hóa"
        subtitle={loading ? "Đang tải..." : `${products.length} sản phẩm`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              📤 Xuất Excel
            </Button>
            <Button size="sm" disabled>
              + Thêm Hàng Hóa
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng SP", value: products.length, color: "text-brand" },
          { label: "Đang bán", value: products.filter((p) => !p.disabled_flag).length, color: "text-success" },
          { label: "Ngừng", value: products.filter((p) => p.disabled_flag).length, color: "text-warning" },
          { label: "Có mã", value: products.filter((p) => p.product_cd).length, color: "text-purple-accent" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`text-xl mt-1 font-semibold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <SearchInput placeholder="Tìm theo tên, mã hàng..." value={search} onChange={setSearch} />
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải danh sách sản phẩm..." icon="⏳" />
        ) : error ? (
          <EmptyState message="Chưa có dữ liệu hoặc API chưa kết nối. Kiểm tra backend đang chạy." icon="⚠️" />
        ) : filtered.length === 0 ? (
          <EmptyState message="Chưa có sản phẩm. Thêm qua API hoặc chờ form thêm mới." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Mã HH</Th>
                <Th>Tên (VN)</Th>
                <Th>Tên (JP)</Th>
                <Th>Giá JPY</Th>
                <Th>Giá VND</Th>
                <Th>NCC</Th>
                <Th>Trạng thái</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.map((product) => (
                <Tr key={product.id}>
                  <Td className="font-medium">{product.product_cd ?? "—"}</Td>
                  <Td>{product.product_name}</Td>
                  <Td className="text-text-muted">{product.product_name_jp ?? "—"}</Td>
                  <Td>{product.cost_jpy?.toLocaleString("vi-VN") ?? "—"}</Td>
                  <Td>{product.price_vnd?.toLocaleString("vi-VN") ?? "—"}</Td>
                  <Td>{product.supplier_name ?? "—"}</Td>
                  <Td>
                    <Badge variant={product.disabled_flag ? "gray" : "success"}>
                      {product.disabled_flag ? "Ngừng" : "Hoạt động"}
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
