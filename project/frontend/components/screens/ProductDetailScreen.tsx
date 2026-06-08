"use client";

import { ProductImageUpload } from "@/components/ProductImageUpload";
import { Badge, Button, Card, PageHeader, Table, Td, Th, Thead, Tr } from "@/components/ui";
import { useIsAdmin } from "@/hooks/usePermission";
import { translateMessage } from "@/lib/messages";
import { feeRateToPercent } from "@/lib/pricing";
import type { ProductBranchStat, ProductItem } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ProductDetailScreen({ productId }: { productId: number }) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<"detail" | "branches">("detail");
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [branchStats, setBranchStats] = useState<ProductBranchStat[]>([]);
  const [branchTotal, setBranchTotal] = useState(0);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proxy/products/${productId}`);
        const data = await res.json();
        if (data.success && data.data?.product) {
          setProduct(data.data.product);
          setPrimaryImage(data.data.product.image_path ?? null);
        } else {
          setError(translateMessage(data.message ?? "M0002"));
        }
      } catch {
        setError("API_OFFLINE");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  useEffect(() => {
    if (!isAdmin || tab !== "branches") return;
    async function loadBranches() {
      setLoadingBranches(true);
      try {
        const res = await fetch(`/api/proxy/products/${productId}/branch-stats`);
        const data = await res.json();
        if (data.success && data.data) {
          setBranchStats(data.data.branches ?? []);
          setBranchTotal(data.data.total_ordered_all_branches ?? 0);
        }
      } finally {
        setLoadingBranches(false);
      }
    }
    loadBranches();
  }, [isAdmin, tab, productId]);

  async function handleDelete() {
    if (!confirm("Xóa mềm sản phẩm này?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/products");
        router.refresh();
      } else {
        setError(translateMessage(data.message ?? "M0304"));
      }
    } catch {
      setError("Không thể xóa sản phẩm.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Card className="p-8 text-center text-text-muted">Đang tải...</Card>;
  }

  if (error || !product) {
    return (
      <Card className="p-8 text-center">
        <p className="text-danger">{error || "Không tìm thấy sản phẩm"}</p>
        <Link href="/products" className="text-brand text-sm mt-4 inline-block">
          ← Danh sách
        </Link>
      </Card>
    );
  }

  const fields = [
    { label: "Mã HH", value: product.product_cd ?? "—" },
    { label: "Danh mục", value: product.category_name ?? "—" },
    { label: "Tên (VN)", value: product.product_name },
    { label: "Tên (JP)", value: product.product_name_jp ?? "—" },
    { label: "NCC", value: product.supplier_name ?? "—" },
    { label: "Quy cách", value: product.spec ?? "—" },
    { label: "Đơn vị", value: product.unit ?? "—" },
    { label: "Giá VND (catalog)", value: product.price_vnd?.toLocaleString("vi-VN") ?? "—" },
    ...(isAdmin
      ? [
          { label: "Giá vốn JPY", value: product.cost_price_jpy != null ? Number(product.cost_price_jpy).toLocaleString("vi-VN") : "—" },
          { label: "Giá bán JPY", value: product.selling_price_jpy != null ? Number(product.selling_price_jpy).toLocaleString("vi-VN") : "—" },
          { label: "Phí dịch vụ", value: product.fee_rate != null ? `${feeRateToPercent(product.fee_rate)}%` : "—" },
          { label: "Giá JPY (legacy)", value: product.cost_jpy?.toLocaleString("vi-VN") ?? "—" },
        ]
      : [{ label: "Giá JPY", value: product.cost_jpy?.toLocaleString("vi-VN") ?? "—" }]),
    { label: "Thuế nhập", value: product.import_tax_rate != null ? `${product.import_tax_rate}%` : "—" },
    { label: "Xuất xứ", value: product.origin ?? "—" },
    { label: "Tồn kho", value: product.inventory_total?.toLocaleString("vi-VN") ?? "0" },
  ];

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title={product.product_name}
        subtitle={product.product_cd ?? "Chi tiết sản phẩm"}
        actions={
          <>
            <Link href={`/products/${productId}/edit`}>
              <Button size="sm">Sửa</Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
            <Link href="/products">
              <Button variant="secondary" size="sm">
                ← Danh sách
              </Button>
            </Link>
          </>
        }
      />

      {isAdmin && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("detail")}
            className={`px-4 py-2 rounded-xl text-sm ${
              tab === "detail" ? "bg-brand text-white" : "bg-white border border-border"
            }`}
          >
            Chi tiết
          </button>
          <button
            type="button"
            onClick={() => setTab("branches")}
            className={`px-4 py-2 rounded-xl text-sm ${
              tab === "branches" ? "bg-brand text-white" : "bg-white border border-border"
            }`}
          >
            Theo chi nhánh
          </button>
        </div>
      )}

      {tab === "branches" && isAdmin ? (
        <Card className="p-6">
          <p className="text-sm text-text-muted mb-4">
            Tổng đã đặt tất cả chi nhánh: <strong>{branchTotal.toLocaleString("vi-VN")}</strong>
          </p>
          {loadingBranches ? (
            <p className="text-sm text-text-muted">Đang tải...</p>
          ) : branchStats.length === 0 ? (
            <p className="text-sm text-text-muted">Chưa có đơn hàng từ chi nhánh nào.</p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Chi nhánh</Th>
                  <Th>Miền</Th>
                  <Th>Tỉnh/TP</Th>
                  <Th>Tổng đặt</Th>
                  <Th>Đang xử lý</Th>
                  <Th>Đã giao</Th>
                  <Th>Đơn gần nhất</Th>
                </Tr>
              </Thead>
              <tbody>
                {branchStats.map((b) => (
                  <Tr key={b.branch_id}>
                    <Td>{b.branch_name}</Td>
                    <Td>{b.region}</Td>
                    <Td>{b.province}</Td>
                    <Td>{Number(b.total_ordered).toLocaleString("vi-VN")}</Td>
                    <Td>{Number(b.pending_qty).toLocaleString("vi-VN")}</Td>
                    <Td>{Number(b.delivered_qty).toLocaleString("vi-VN")}</Td>
                    <Td>{b.last_order_date ? String(b.last_order_date).slice(0, 10) : "—"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      ) : (
        <>
      {primaryImage && (
        <Card className="p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt={product.product_name}
            className="w-full max-h-64 object-contain rounded-xl"
          />
        </Card>
      )}

      <ProductImageUpload productId={productId} onPrimaryChange={setPrimaryImage} />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Badge variant={product.disabled_flag ? "gray" : "success"}>
            {product.disabled_flag ? "Ngừng" : "Hoạt động"}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-text-muted uppercase tracking-wide">{f.label}</dt>
              <dd className="text-sm text-text-primary mt-0.5">{f.value}</dd>
            </div>
          ))}
        </dl>

        {product.description && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Mô tả</p>
            <p className="text-sm text-text-body whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {product.memo && (
          <div className="mt-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Ghi chú</p>
            <p className="text-sm text-text-muted">{product.memo}</p>
          </div>
        )}
      </Card>
        </>
      )}
    </div>
  );
}
