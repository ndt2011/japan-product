'use client';

/**
 * ProductForm — Tạo / Sửa sản phẩm
 *
 * Cách dùng (create):
 *   <ProductForm mode="create" />
 *
 * Cách dùng (edit):
 *   <ProductForm mode="edit" product={productData} />
 *
 * Submit: FormData (multipart) — KHÔNG set Content-Type header
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader, { buildProductFormData } from './ImageUploader';

interface ProductData {
  id?: number;
  product_cd?: string;
  name_jp: string;
  name_vi?: string;
  description_jp?: string;
  description_vi?: string;
  unit_price_vnd?: number;
  cost_jpy?: number;
  tax_rate?: number;
  markup_rate?: number;
  category_id?: number;
  supplier_id?: number;
  images?: Array<{ id: number; image_path: string; image_url: string; is_primary: boolean; order_no: number }>;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  product?: ProductData;
}

// ─── Price preview helper ─────────────────────────────────────────────────────
function calcPriceVnd(
  costJpy: number,
  exchangeRate: number,
  taxRate: number,
  markupRate: number
): number {
  return Math.round(costJpy * exchangeRate * (1 + taxRate) * (1 + markupRate));
}

function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const [tab,        setTab]        = useState<'jp' | 'vi'>('jp');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [primaryIdx, setPrimaryIdx] = useState(0);

  // Exchange rate state (fetch on mount)
  const [exchangeRate, setExchangeRate] = useState(175);

  useEffect(() => {
    fetch('/api/exchange-rates/current', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then((d) => d.data?.jpy_vnd && setExchangeRate(d.data.jpy_vnd))
      .catch(() => {});
  }, []);

  // Form fields
  const [fields, setFields] = useState({
    product_cd:     product?.product_cd     ?? '',
    name_jp:        product?.name_jp        ?? '',
    name_vi:        product?.name_vi        ?? '',
    description_jp: product?.description_jp ?? '',
    description_vi: product?.description_vi ?? '',
    unit_price_vnd: product?.unit_price_vnd ?? '',
    cost_jpy:       product?.cost_jpy       ?? '',
    tax_rate:       product?.tax_rate       ?? 0.10,
    markup_rate:    product?.markup_rate    ?? 0.20,
    category_id:    product?.category_id    ?? '',
    supplier_id:    product?.supplier_id    ?? '',
  });

  const set = (key: string, val: string | number) =>
    setFields((prev) => ({ ...prev, [key]: val }));

  // Auto price preview
  const pricePreview =
    fields.cost_jpy && exchangeRate
      ? calcPriceVnd(
          Number(fields.cost_jpy),
          exchangeRate,
          Number(fields.tax_rate),
          Number(fields.markup_rate)
        )
      : null;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = buildProductFormData(
        {
          ...fields,
          unit_price_vnd: pricePreview ?? fields.unit_price_vnd,
        },
        imageFiles,
        primaryIdx
      );

      const url    = mode === 'create' ? '/api/products' : `/api/products/${product?.id}`;
      const method = mode === 'create' ? 'POST' : 'POST'; // Laravel _method spoofing

      if (mode === 'edit') formData.append('_method', 'PUT');

      const res = await fetch(url, {
        method,
        // ⚠️ KHÔNG set Content-Type — để browser tự set boundary cho multipart
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message ?? 'Có lỗi xảy ra');
        return;
      }

      router.push('/products');
      router.refresh();
    } catch {
      setError('Lỗi kết nối. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* ── Section 1: Thông tin cơ bản ──────────────────────────────────── */}
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Thông tin cơ bản</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm</label>
            <input
              className="input"
              value={fields.product_cd}
              onChange={(e) => set('product_cd', e.target.value)}
              placeholder="SP-JP-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <input
              className="input"
              type="number"
              value={fields.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              placeholder="ID danh mục"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
          <input
            className="input"
            type="number"
            value={fields.supplier_id}
            onChange={(e) => set('supplier_id', e.target.value)}
            placeholder="ID nhà cung cấp"
          />
        </div>
      </section>

      {/* ── Section 2: Tên & Mô tả (tab JP / VI) ────────────────────────── */}
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Tên & Mô tả</h2>

        {/* Tab switcher */}
        <div className="flex border-b">
          {(['jp', 'vi'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'jp' ? '🇯🇵 日本語' : '🇻🇳 Tiếng Việt'}
            </button>
          ))}
        </div>

        {tab === 'jp' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm (JP) <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="input"
                value={fields.name_jp}
                onChange={(e) => set('name_jp', e.target.value)}
                placeholder="例: ドリップコーヒーメーカー"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (JP)</label>
              <textarea
                className="input h-28 resize-none"
                value={fields.description_jp}
                onChange={(e) => set('description_jp', e.target.value)}
              />
            </div>
          </div>
        )}

        {tab === 'vi' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm (VI)</label>
              <input
                className="input"
                value={fields.name_vi}
                onChange={(e) => set('name_vi', e.target.value)}
                placeholder="VD: Máy pha cà phê nhỏ giọt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (VI)</label>
              <textarea
                className="input h-28 resize-none"
                value={fields.description_vi}
                onChange={(e) => set('description_vi', e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Section 3: Giá ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Giá bán</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn (¥)</label>
            <input
              type="number" min="0" step="0.01"
              className="input"
              value={fields.cost_jpy}
              onChange={(e) => set('cost_jpy', e.target.value)}
              placeholder="1500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thuế nhập (%)</label>
            <input
              type="number" min="0" max="1" step="0.01"
              className="input"
              value={Number(fields.tax_rate) * 100}
              onChange={(e) => set('tax_rate', Number(e.target.value) / 100)}
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Markup (%)</label>
            <input
              type="number" min="0" step="0.01"
              className="input"
              value={Number(fields.markup_rate) * 100}
              onChange={(e) => set('markup_rate', Number(e.target.value) / 100)}
              placeholder="20"
            />
          </div>
        </div>

        {/* Price preview */}
        {pricePreview !== null && (
          <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
            <span className="text-gray-600">Giá bán tự tính: </span>
            <span className="font-bold text-blue-700 text-base">{formatVND(pricePreview)}</span>
            <span className="text-gray-400 ml-2 text-xs">
              (¥{fields.cost_jpy} × {exchangeRate} × {(1 + Number(fields.tax_rate)).toFixed(2)} × {(1 + Number(fields.markup_rate)).toFixed(2)})
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá bán tay (VND) <span className="text-gray-400 text-xs">(bỏ trống → dùng giá tự tính)</span>
          </label>
          <input
            type="number" min="0"
            className="input"
            value={fields.unit_price_vnd}
            onChange={(e) => set('unit_price_vnd', e.target.value)}
            placeholder={pricePreview ? String(pricePreview) : '0'}
          />
        </div>
      </section>

      {/* ── Section 4: Ảnh sản phẩm ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Ảnh sản phẩm</h2>
        <ImageUploader
          existingImages={product?.images}
          maxImages={8}
          onChange={(files, primary) => {
            setImageFiles(files);
            setPrimaryIdx(primary);
          }}
        />
      </section>

      {/* ── Error + Submit ────────────────────────────────────────────────── */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Đang lưu...' : mode === 'create' ? 'Tạo sản phẩm' : 'Cập nhật'}
        </button>
      </div>
    </form>
  );
}
