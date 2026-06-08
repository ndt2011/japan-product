"use client";

import { ProductImagePicker } from "@/components/ProductImagePicker";
import { ProductImageUpload } from "@/components/ProductImageUpload";
import { useIsAdmin, usePermission } from "@/hooks/usePermission";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validateProductForm,
  type FieldErrors,
} from "@/lib/form-validation";
import { translateMessage } from "@/lib/messages";
import { toast } from "@/lib/toast";
import {
  calcUnitPriceVnd,
  feeRateToPercent,
  percentToFeeRate,
} from "@/lib/pricing";
import type { CategoryOption, ProductFormData, ProductItem, SupplierOption } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const emptyForm: ProductFormData = {
  product_category_id: "",
  product_cd: "",
  product_name: "",
  product_name_jp: "",
  name_vi: "",
  description_vi: "",
  supplier_id: "",
  spec: "",
  unit: "",
  cost_jpy: "",
  cost_price_jpy: "",
  selling_price_jpy: "",
  fee_rate_percent: 5,
  price_vnd: "",
  retail_price_vnd: "",
  barcode: "",
  min_order_qty: "",
  import_tax_rate: "",
  origin: "Nhật Bản",
  description: "",
  memo: "",
  disabled_flag: false,
};

function productToForm(product: ProductItem): ProductFormData {
  return {
    product_category_id: product.product_category_id ?? "",
    product_cd: product.product_cd ?? "",
    product_name: product.product_name,
    product_name_jp: product.product_name_jp ?? "",
    name_vi: product.name_vi ?? "",
    description_vi: product.description_vi ?? "",
    supplier_id: product.supplier_id ?? "",
    spec: product.spec ?? "",
    unit: product.unit ?? "",
    cost_jpy: product.cost_jpy ?? "",
    cost_price_jpy:
      product.cost_price_jpy != null ? Number(product.cost_price_jpy) : product.cost_jpy ?? "",
    selling_price_jpy:
      product.selling_price_jpy != null
        ? Number(product.selling_price_jpy)
        : product.cost_jpy ?? "",
    fee_rate_percent: feeRateToPercent(product.fee_rate),
    price_vnd: product.price_vnd ?? "",
    retail_price_vnd: product.retail_price_vnd ?? "",
    barcode: product.barcode ?? "",
    min_order_qty: product.min_order_qty ?? "",
    import_tax_rate: product.import_tax_rate ?? "",
    origin: product.origin ?? "Nhật Bản",
    description: product.description ?? "",
    memo: product.memo ?? "",
    disabled_flag: product.disabled_flag,
  };
}

interface ProductFormScreenProps {
  mode: "create" | "edit";
  productId?: number;
}

export function ProductFormScreen({ mode, productId }: ProductFormScreenProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const canUpload = usePermission("products.create");
  const isAdmin = useIsAdmin();

  useEffect(() => {
    async function loadMaster() {
      const [catRes, supRes, rateRes] = await Promise.all([
        fetch("/api/proxy/product-categories"),
        fetch("/api/proxy/suppliers"),
        fetch("/api/proxy/exchange-rates/current"),
      ]);
      const catData = await catRes.json();
      const supData = await supRes.json();
      const rateData = await rateRes.json();

      if (catData.success && catData.data?.items) {
        setCategories(catData.data.items);
      }
      if (supData.success && supData.data?.items) {
        setSuppliers(supData.data.items);
      }
      if (rateData.success && rateData.data?.rate) {
        setExchangeRate(Number(rateData.data.rate));
      }
    }
    loadMaster();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;

    async function loadProduct() {
      try {
        const res = await fetch(`/api/proxy/products/${productId}`);
        const data = await res.json();
        if (data.success && data.data?.product) {
          setForm(productToForm(data.data.product));
        } else {
          setError(translateMessage(data.message ?? "M0002"));
        }
      } catch {
        setError("API_OFFLINE");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [mode, productId]);

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => clearFieldError(prev, String(key)));
  }

  function suggestVndFromLegacy() {
    if (!exchangeRate || form.cost_jpy === "") return;
    const jpy = Number(form.cost_jpy);
    const tax = form.import_tax_rate !== "" ? Number(form.import_tax_rate) : 0;
    const vnd = Math.ceil((jpy * exchangeRate * (1 + tax / 100)) / 1000) * 1000;
    updateField("price_vnd", vnd);
  }

  function suggestVndFromDualPricing() {
    if (!exchangeRate || form.selling_price_jpy === "") return;
    const feeRate = percentToFeeRate(form.fee_rate_percent) ?? 0.05;
    const vnd = calcUnitPriceVnd(Number(form.selling_price_jpy), exchangeRate, feeRate);
    updateField("price_vnd", vnd);
  }

  const previewUnitVnd =
    exchangeRate && form.selling_price_jpy !== ""
      ? calcUnitPriceVnd(
          Number(form.selling_price_jpy),
          exchangeRate,
          percentToFeeRate(form.fee_rate_percent) ?? 0.05,
        )
      : null;

  function dualPricingPayload() {
    const feeRate = percentToFeeRate(form.fee_rate_percent);
    return {
      cost_price_jpy: form.cost_price_jpy !== "" ? Number(form.cost_price_jpy) : null,
      selling_price_jpy: form.selling_price_jpy !== "" ? Number(form.selling_price_jpy) : null,
      fee_rate: feeRate ?? 0.05,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validateProductForm(form, isAdmin);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) {
      setError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const url = mode === "create" ? "/api/proxy/products" : `/api/proxy/products/${productId}`;
      let res: Response;

      if (mode === "create" && imageFiles.length > 0) {
        const body = new FormData();
        body.append("product_category_id", String(Number(form.product_category_id)));
        if (form.product_cd) body.append("product_cd", form.product_cd);
        body.append("product_name", form.product_name);
        if (form.product_name_jp) body.append("product_name_jp", form.product_name_jp);
        if (form.name_vi) body.append("name_vi", form.name_vi);
        if (form.description_vi) body.append("description_vi", form.description_vi);
        if (form.supplier_id) body.append("supplier_id", String(Number(form.supplier_id)));
        if (form.spec) body.append("spec", form.spec);
        if (form.unit) body.append("unit", form.unit);
        if (form.cost_jpy !== "") body.append("cost_jpy", String(form.cost_jpy));
        if (isAdmin) {
          const dual = dualPricingPayload();
          if (dual.cost_price_jpy != null) body.append("cost_price_jpy", String(dual.cost_price_jpy));
          if (dual.selling_price_jpy != null) body.append("selling_price_jpy", String(dual.selling_price_jpy));
          body.append("fee_rate", String(dual.fee_rate));
        }
        if (form.price_vnd !== "") body.append("price_vnd", String(form.price_vnd));
        if (form.retail_price_vnd !== "") body.append("retail_price_vnd", String(form.retail_price_vnd));
        if (form.barcode) body.append("barcode", form.barcode);
        if (form.min_order_qty !== "") body.append("min_order_qty", String(form.min_order_qty));
        if (form.import_tax_rate !== "") body.append("import_tax_rate", String(form.import_tax_rate));
        if (form.origin) body.append("origin", form.origin);
        if (form.description) body.append("description", form.description);
        if (form.memo) body.append("memo", form.memo);
        body.append("disabled_flag", form.disabled_flag ? "1" : "0");
        imageFiles.forEach((file) => body.append("images[]", file));

        res = await fetch(url, { method: "POST", body });
      } else {
        const payload = {
          product_category_id: Number(form.product_category_id),
          product_cd: form.product_cd || null,
          product_name: form.product_name,
          product_name_jp: form.product_name_jp || null,
          name_vi: form.name_vi || null,
          description_vi: form.description_vi || null,
          supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
          spec: form.spec || null,
          unit: form.unit || null,
          cost_jpy: form.cost_jpy !== "" ? Number(form.cost_jpy) : null,
          ...(isAdmin ? dualPricingPayload() : {}),
          price_vnd: form.price_vnd !== "" ? Number(form.price_vnd) : null,
          retail_price_vnd: form.retail_price_vnd !== "" ? Number(form.retail_price_vnd) : null,
          barcode: form.barcode || null,
          min_order_qty: form.min_order_qty !== "" ? Number(form.min_order_qty) : null,
          import_tax_rate: form.import_tax_rate !== "" ? Number(form.import_tax_rate) : null,
          origin: form.origin || null,
          description: form.description || null,
          memo: form.memo || null,
          disabled_flag: form.disabled_flag,
        };

        res = await fetch(url, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = translateMessage(data.message ?? "M0001");
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(mode === "create" ? "Đã thêm sản phẩm." : "Đã lưu thay đổi sản phẩm.");
      const id = data.data?.product?.id ?? productId;
      router.push(id ? `/products/${id}` : "/products");
      router.refresh();
    } catch {
      const msg = "Không thể lưu sản phẩm. Kiểm tra API backend.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Card className="p-8 text-center text-text-muted">Đang tải sản phẩm...</Card>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title={mode === "create" ? "Thêm Hàng Hóa" : "Sửa Hàng Hóa"}
        subtitle="Theo thiết kế 2-001"
        actions={
          <Link href={productId ? `/products/${productId}` : "/products"}>
            <Button variant="secondary" size="sm">
              ← Quay lại
            </Button>
          </Link>
        }
      />

      {error && (
        <Card className="p-4 border-danger/30 bg-red-50 text-sm text-danger">{error}</Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Danh mục *"
              required
              value={form.product_category_id}
              onChange={(e) => updateField("product_category_id", e.target.value ? Number(e.target.value) : "")}
              options={categories.map((c) => ({ value: c.id, label: c.category_name }))}
              placeholder="Chọn danh mục"
              error={fieldErrors.product_category_id}
            />
            <Input
              label="Mã hàng hóa"
              value={form.product_cd}
              onChange={(e) => updateField("product_cd", e.target.value)}
              placeholder="P001"
            />
            <Input
              label="Tên (Tiếng Việt) *"
              required
              value={form.product_name}
              onChange={(e) => updateField("product_name", e.target.value)}
              error={fieldErrors.product_name}
            />
            <Input
              label="Tên (Tiếng Nhật)"
              required={isAdmin}
              value={form.product_name_jp}
              onChange={(e) => updateField("product_name_jp", e.target.value)}
              error={fieldErrors.product_name_jp}
            />
            <Input
              label="Tên VN (AI search)"
              value={form.name_vi}
              onChange={(e) => updateField("name_vi", e.target.value)}
              placeholder="VD: Viên uống bổ gan Orihiro"
            />
            <Select
              label="Nhà cung cấp"
              value={form.supplier_id}
              onChange={(e) => updateField("supplier_id", e.target.value ? Number(e.target.value) : "")}
              options={suppliers.map((s) => ({ value: s.id, label: s.supplier_name }))}
              placeholder="Chọn NCC"
            />
            <Input
              label="Xuất xứ"
              value={form.origin}
              onChange={(e) => updateField("origin", e.target.value)}
            />
            <Input
              label="Quy cách"
              required
              value={form.spec}
              onChange={(e) => updateField("spec", e.target.value)}
              error={fieldErrors.spec}
            />
            <Input
              label="Đơn vị"
              required
              value={form.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              placeholder="hộp, chai..."
              error={fieldErrors.unit}
            />
            <Input
              label="Mã vạch (barcode)"
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
            />
            <Input
              label="SL đặt tối thiểu"
              type="number"
              min={1}
              value={form.min_order_qty}
              onChange={(e) =>
                updateField("min_order_qty", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
            {!isAdmin && (
              <Input
                label="Giá nhập JPY"
                type="number"
                min={0}
                value={form.cost_jpy}
                onChange={(e) => updateField("cost_jpy", e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={suggestVndFromLegacy}
              />
            )}
            <div className="flex flex-col gap-1 md:col-span-2">
              <Input
                label="Giá bán VND (catalog)"
                type="number"
                min={0}
                value={form.price_vnd}
                onChange={(e) => updateField("price_vnd", e.target.value === "" ? "" : Number(e.target.value))}
                hint={isAdmin ? "Đại lý thấy giá này — có thể gợi ý từ giá kép bên dưới" : undefined}
                error={fieldErrors.price_vnd}
              />
              <Input
                label="Giá lẻ VND (chi nhánh)"
                type="number"
                min={0}
                value={form.retail_price_vnd}
                onChange={(e) =>
                  updateField("retail_price_vnd", e.target.value === "" ? "" : Number(e.target.value))
                }
                hint="Chi nhánh thấy giá lẻ này"
              />
              {!isAdmin && exchangeRate && (
                <button
                  type="button"
                  onClick={suggestVndFromLegacy}
                  className="text-xs text-brand hover:underline text-left"
                >
                  Gợi ý từ tỷ giá {exchangeRate} JPY/VND
                </button>
              )}
            </div>
            <Input
              label="Thuế nhập (%)"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.import_tax_rate}
              onChange={(e) =>
                updateField("import_tax_rate", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>

          {isAdmin && (
            <Card className="p-4 bg-surface-subtle border-brand/20 space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Giá kép (Admin only)</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Công thức: đơn giá VND = giá bán JPY × tỷ giá × (1 + phí %). Dùng khi lập hóa đơn &amp; báo cáo lãi.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Giá vốn JPY"
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={form.cost_price_jpy}
                  onChange={(e) =>
                    updateField("cost_price_jpy", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  hint="Chỉ Admin thấy — dùng tính lợi nhuận"
                  error={fieldErrors.cost_price_jpy}
                />
                <Input
                  label="Giá bán JPY"
                  type="number"
                  min={0}
                  step={0.01}
                  optional
                  value={form.selling_price_jpy}
                  onChange={(e) =>
                    updateField("selling_price_jpy", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={suggestVndFromDualPricing}
                  hint="Giá bán cho đại lý (trước quy đổi VND)"
                />
                <Input
                  label="Phí dịch vụ (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.fee_rate_percent}
                  onChange={(e) =>
                    updateField("fee_rate_percent", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={suggestVndFromDualPricing}
                  hint="Mặc định 5% — gộp vào đơn giá VND"
                />
                <Input
                  label="Giá nhập JPY (legacy)"
                  type="number"
                  min={0}
                  optional
                  value={form.cost_jpy}
                  onChange={(e) => updateField("cost_jpy", e.target.value === "" ? "" : Number(e.target.value))}
                  hint="Trường cũ — đồng bộ nếu chưa có giá kép"
                />
              </div>
              {exchangeRate && previewUnitVnd != null && previewUnitVnd > 0 && (
                <div className="rounded-xl bg-white border border-border px-4 py-3 text-sm">
                  <span className="text-text-muted">Preview đơn giá VND: </span>
                  <strong className="text-brand">{previewUnitVnd.toLocaleString("vi-VN")} ₫</strong>
                  <span className="text-text-muted text-xs ml-2">
                    (tỷ giá {exchangeRate}, phí {form.fee_rate_percent || 5}%)
                  </span>
                  <button
                    type="button"
                    onClick={suggestVndFromDualPricing}
                    className="block mt-2 text-xs text-brand hover:underline"
                  >
                    Áp dụng vào Giá bán VND (catalog)
                  </button>
                </div>
              )}
            </Card>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-body">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-body">Mô tả VN (AI search)</label>
            <textarea
              value={form.description_vi}
              onChange={(e) => updateField("description_vi", e.target.value)}
              rows={2}
              placeholder="Công dụng, đối tượng dùng — giúp tìm catalog tiếng Việt"
              className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <Input
            label="Ghi chú"
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
          />

          {mode === "create" && canUpload && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-body">Ảnh sản phẩm</label>
              <ProductImagePicker files={imageFiles} onChange={setImageFiles} />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.disabled_flag}
              onChange={(e) => updateField("disabled_flag", e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-text-body">Ngừng kinh doanh</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : mode === "create" ? "Tạo sản phẩm" : "Cập nhật"}
            </Button>
            <Link href="/products">
              <Button type="button" variant="secondary">
                Hủy
              </Button>
            </Link>
          </div>
        </Card>
      </form>

      {mode === "edit" && productId && (
        <ProductImageUpload productId={productId} />
      )}
    </div>
  );
}
