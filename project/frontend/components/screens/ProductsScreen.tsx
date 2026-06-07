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
import { usePermission } from "@/hooks/usePermission";
import type { CategoryOption, ProductItem } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function ProductsScreen() {
  const canCreate = usePermission("products.create");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (categoryId) params.set("category_id", categoryId);

      const res = await fetch(`/api/proxy/products?${params}`);
      const data = await res.json();
      if (data.success && data.data?.items) {
        setProducts(data.data.items);
        setPagination({
          total: data.data.pagination?.total ?? 0,
          last_page: data.data.pagination?.last_page ?? 1,
        });
      } else {
        setError(data.message ?? "Không tải được dữ liệu");
      }
    } catch {
      setError("API_OFFLINE");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId]);

  useEffect(() => {
    fetch("/api/proxy/product-categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.items) setCategories(d.data.items);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Lý Hàng Hóa"
        subtitle={loading ? "Đang tải..." : `${pagination.total} sản phẩm`}
        actions={
          <>
            <Button variant="secondary" size="sm" disabled>
              📤 Xuất Excel
            </Button>
            {canCreate && (
              <Link href="/products/new">
                <Button size="sm">+ Thêm Hàng Hóa</Button>
              </Link>
            )}
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput
            placeholder="Tìm theo tên, mã hàng..."
            value={search}
            onChange={setSearch}
            className="flex-1 min-w-52"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <EmptyState message="Đang tải danh sách sản phẩm..." icon="⏳" />
        ) : error ? (
          <EmptyState message="Chưa có dữ liệu hoặc API chưa kết nối." icon="⚠️" />
        ) : products.length === 0 ? (
          <EmptyState message="Chưa có sản phẩm." />
        ) : (
          <>
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
                {products.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <Link
                        href={`/products/${product.id}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {product.product_cd ?? `#${product.id}`}
                      </Link>
                    </Td>
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

            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-text-muted">
                  Trang {page} / {pagination.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pagination.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
