"use client";

import { ProductImageUpload } from "@/components/ProductImageUpload";
import { Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { CategoryOption, ProductFormData, ProductItem, SupplierOption } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const emptyForm: ProductFormData = {
  product_category_id: "",
  product_cd: "",
  product_name: "",
  product_name_jp: "",
  supplier_id: "",
  spec: "",
  unit: "",
  cost_jpy: "",
  price_vnd: "",
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
    supplier_id: product.supplier_id ?? "",
    spec: product.spec ?? "",
    unit: product.unit ?? "",
    cost_jpy: product.cost_jpy ?? "",
    price_vnd: product.price_vnd ?? "",
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
  }

  function suggestVnd() {
    if (!exchangeRate || form.cost_jpy === "") return;
    const jpy = Number(form.cost_jpy);
    const tax = form.import_tax_rate !== "" ? Number(form.import_tax_rate) : 0;
    const vnd = Math.ceil((jpy * exchangeRate * (1 + tax / 100)) / 1000) * 1000;
    updateField("price_vnd", vnd);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      product_category_id: Number(form.product_category_id),
      product_cd: form.product_cd || null,
      product_name: form.product_name,
      product_name_jp: form.product_name_jp || null,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      spec: form.spec || null,
      unit: form.unit || null,
      cost_jpy: form.cost_jpy !== "" ? Number(form.cost_jpy) : null,
      price_vnd: form.price_vnd !== "" ? Number(form.price_vnd) : null,
      import_tax_rate: form.import_tax_rate !== "" ? Number(form.import_tax_rate) : null,
      origin: form.origin || null,
      description: form.description || null,
      memo: form.memo || null,
      disabled_flag: form.disabled_flag,
    };

    try {
      const url = mode === "create" ? "/api/proxy/products" : `/api/proxy/products/${productId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }

      const id = data.data?.product?.id ?? productId;
      router.push(id ? `/products/${id}` : "/products");
      router.refresh();
    } catch {
      setError("Không thể lưu sản phẩm. Kiểm tra API backend.");
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
            />
            <Input
              label="Tên (Tiếng Nhật)"
              value={form.product_name_jp}
              onChange={(e) => updateField("product_name_jp", e.target.value)}
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
              value={form.spec}
              onChange={(e) => updateField("spec", e.target.value)}
            />
            <Input
              label="Đơn vị"
              value={form.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              placeholder="hộp, chai..."
            />
            <Input
              label="Giá nhập JPY"
              type="number"
              min={0}
              value={form.cost_jpy}
              onChange={(e) => updateField("cost_jpy", e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={suggestVnd}
            />
            <div className="flex flex-col gap-1">
              <Input
                label="Giá bán VND"
                type="number"
                min={0}
                value={form.price_vnd}
                onChange={(e) => updateField("price_vnd", e.target.value === "" ? "" : Number(e.target.value))}
              />
              {exchangeRate && (
                <button
                  type="button"
                  onClick={suggestVnd}
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

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-body">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <Input
            label="Ghi chú"
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
          />

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
