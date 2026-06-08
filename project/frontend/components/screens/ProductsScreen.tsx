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
import { useAuthStore } from "@/stores/useAuthStore";
import type { CategoryOption, ProductItem, StockStatus } from "@/types/api";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// ─── Stock badge ──────────────────────────────────────────────────────────────
const STOCK_LABEL: Record<StockStatus, string> = {
  IN_STOCK: "Còn hàng",
  LOW_STOCK: "Sắp hết",
  OUT_OF_STOCK: "Hết hàng",
};
const STOCK_VARIANT: Record<StockStatus, "success" | "warning" | "gray"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "gray",
};

function StockBadge({ product }: { product: ProductItem }) {
  const status = product.stock_status ?? "OUT_OF_STOCK";
  const qty = product.available_qty ?? 0;
  const label =
    status === "LOW_STOCK"
      ? `Sắp hết (${qty})`
      : STOCK_LABEL[status];
  return (
    <Badge variant={STOCK_VARIANT[status]}>
      {label}
    </Badge>
  );
}

// ─── Product thumbnail ────────────────────────────────────────────────────────
function ProductThumb({ src, name }: { src?: string | null; name: string }) {
  if (!src) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
        🖼
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      className="w-10 h-10 rounded-lg object-cover border border-border"
      unoptimized
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function ProductsScreen() {
  const canCreate = usePermission("products.create");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [productStatus, setProductStatus] = useState("active"); // "active" | "disabled"
  const [page, setPage] = useState(1);
  const userType = useAuthStore((s) => s.user?.user_type);
  const isAdminOrCompany = userType === "admin" || userType === "company";
  const isBranch = userType === "branch_manager" || userType === "branch_staff";
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (categoryId) params.set("category_id", categoryId);
      if (stockFilter) params.set("stock_status", stockFilter);
      if (productStatus === "disabled") params.set("product_status", "disabled");

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
  }, [page, search, categoryId, stockFilter, productStatus]);

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
  }, [search, categoryId, stockFilter, productStatus]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản Lý Hàng Hóa"
        subtitle={
          loading
            ? "Đang tải..."
            : `${pagination.total} sản phẩm${isBranch ? " · chỉ hàng đang kinh doanh" : ""}`
        }
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
          {/* Filter tồn kho — spec: product-tier-model.md § 2 */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body"
          >
            <option value="">Tất cả tồn kho</option>
            <option value="IN_STOCK">🟢 Còn hàng</option>
            <option value="LOW_STOCK">🟡 Sắp hết</option>
            <option value="OUT_OF_STOCK">🔴 Hết hàng</option>
          </select>
          {/* Filter trạng thái sản phẩm: chỉ admin/company (FE-V3-024) */}
          {isAdminOrCompany && (
            <select
              value={productStatus}
              onChange={(e) => setProductStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border text-sm bg-white text-text-body"
            >
              <option value="active">✅ Đang kinh doanh</option>
              <option value="disabled">⛔ Đã vô hiệu hoá</option>
            </select>
          )}
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
            {/* Mobile card list — FE-V3-029 */}
            <div className="md:hidden divide-y divide-border">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex gap-3 p-4 hover:bg-surface-subtle transition-colors"
                >
                  <ProductThumb
                    src={product.primary_image_url ?? product.image_path}
                    name={product.product_name}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-text-primary truncate">{product.product_name}</p>
                    <p className="text-xs text-text-muted font-mono">{product.product_cd ?? `#${product.id}`}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-text-body">
                        {product.price_vnd?.toLocaleString("vi-VN") ?? "—"}đ
                      </span>
                      <StockBadge product={product} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>Ảnh</Th>
                  <Th>Mã HH</Th>
                  <Th>Tên (VN)</Th>
                  <Th>Tên (JP)</Th>
                  <Th>Giá JPY</Th>
                  <Th>Giá VND</Th>
                  <Th>Tồn kho</Th>
                  <Th>Trạng thái</Th>
                </tr>
              </Thead>
              <tbody>
                {products.map((product) => (
                  <Tr key={product.id}>
                    {/* Ảnh chính */}
                    <Td>
                      <ProductThumb
                        src={product.primary_image_url ?? product.image_path}
                        name={product.product_name}
                      />
                    </Td>
                    {/* Mã hàng hóa */}
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
                    {/* Tồn kho (available_qty) — spec: product-tier-model.md § 3 */}
                    <Td>
                      <StockBadge product={product} />
                    </Td>
                    {/* Trạng thái sản phẩm */}
                    <Td>
                      <Badge variant={product.disabled_flag ? "gray" : "success"}>
                        {product.disabled_flag ? "Ngừng" : "Hoạt động"}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            </div>

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
