"use client";

import { Button, Card, Input, PageHeader } from "@/components/ui";
import {
  clearFieldError,
  hasFieldErrors,
  validatePurchasingQuery,
  type FieldErrors,
} from "@/lib/form-validation";
import { FormEvent, useState } from "react";

interface ScoreDetail {
  price: number;
  quality: number;
  review: number;
  warranty: number;
  brand: number;
}

interface PurchasingResult {
  source?: string;
  name?: string;
  name_jp?: string;
  price_jpy?: number;
  price_vnd?: number;
  brand?: string | null;
  review_score?: number | null;
  review_count?: number | null;
  image_url?: string | null;
  url?: string | null;
  scores: ScoreDetail;
  total_score: number;
}

interface PurchasingResponse {
  success: boolean;
  query: string;
  keyword_jp?: string;
  results: PurchasingResult[];
  recommendation?: PurchasingResult | null;
  report?: string;
  message?: string;
}

function fmtJpy(v?: number | null) {
  if (!v) return "—";
  return `¥${v.toLocaleString("ja-JP")}`;
}

function fmtVnd(v?: number | null) {
  if (!v) return "";
  return `${v.toLocaleString("vi-VN")}đ`;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>{label}</span>
        <span className="font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProductCard({
  item,
  rank,
  isTop,
}: {
  item: PurchasingResult;
  rank: number;
  isTop: boolean;
}) {
  const name = item.name ?? item.name_jp ?? "Unknown";
  const jpName = item.name_jp ?? "";

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        isTop
          ? "border-brand bg-brand/5 shadow-sm"
          : "border-border bg-white"
      }`}
    >
      {/* Rank + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isTop ? "bg-brand text-white" : "bg-surface-subtle text-text-muted"
            }`}
          >
            {rank}
          </span>
          {isTop && (
            <span className="text-[10px] font-medium bg-brand text-white rounded-full px-2 py-0.5">
              ⭐ Khuyến nghị
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-text-primary">
          {item.total_score.toFixed(1)}<span className="text-xs text-text-muted">/10</span>
        </span>
      </div>

      {/* Image + name */}
      <div className="flex gap-3">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={name}
            className="w-16 h-16 object-contain rounded border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-surface-subtle rounded border border-border flex items-center justify-center text-2xl flex-shrink-0">
            📦
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary line-clamp-2">{name}</p>
          {jpName && jpName !== name && (
            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{jpName}</p>
          )}
          {item.brand && (
            <p className="text-[10px] text-brand mt-0.5">{item.brand}</p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold text-text-primary">{fmtJpy(item.price_jpy)}</span>
        {item.price_vnd ? (
          <span className="text-xs text-text-muted">≈ {fmtVnd(item.price_vnd)}</span>
        ) : null}
      </div>

      {/* Score bars */}
      <div className="space-y-1.5 pt-1">
        <ScoreBar label="Giá cả (30%)" value={item.scores.price} color="bg-green-500" />
        <ScoreBar label="Chất lượng (30%)" value={item.scores.quality} color="bg-blue-500" />
        <ScoreBar label="Đánh giá (20%)" value={item.scores.review} color="bg-yellow-500" />
        <ScoreBar label="Bảo hành (10%)" value={item.scores.warranty} color="bg-purple-500" />
        <ScoreBar label="Thương hiệu (10%)" value={item.scores.brand} color="bg-orange-500" />
      </div>

      {/* Review info */}
      {(item.review_score || item.review_count) && (
        <p className="text-[10px] text-text-muted">
          {item.review_score ? `⭐ ${item.review_score}/5` : ""}
          {item.review_count ? ` · ${item.review_count.toLocaleString()} đánh giá` : ""}
        </p>
      )}

      {/* Link */}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-brand hover:underline border border-brand rounded-lg py-1.5"
        >
          Xem trên Rakuten →
        </a>
      )}
    </div>
  );
}

export function PurchasingScreen() {
  const [form, setForm] = useState({
    query: "",
    budget_jpy: "",
    qty: "1",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurchasingResponse | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const SUGGESTED = [
    "Vitamin C DHC ngân sách 2000 JPY",
    "Collagen Fancl tốt nhất",
    "Tã giấy Merries cho bé",
    "Kem chống nắng Nhật tốt",
    "Máy đo huyết áp Omron",
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validatePurchasingQuery(form.query);
    setFieldErrors(errors);
    if (hasFieldErrors(errors)) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const body: Record<string, unknown> = { query: form.query.trim() };
      if (form.budget_jpy) body.budget_jpy = Number(form.budget_jpy);
      if (form.qty) body.qty = Number(form.qty);

      const res = await fetch("/api/proxy/ai/purchasing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.data?.message ?? data.message ?? "Không tìm thấy sản phẩm phù hợp.");
        return;
      }
      setResult(data.data as PurchasingResponse);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="🛍️ Tư Vấn Thu Mua AI"
        subtitle="Tìm và so sánh sản phẩm Nhật tốt nhất theo yêu cầu của bạn"
      />

      {/* Search form */}
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nhập yêu cầu tìm kiếm <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder='Ví dụ: "Tìm vitamin C Nhật, ngân sách 500k/hộp, mua 20 hộp" hoặc "DHC collagen tốt nhất"'
              value={form.query}
              onChange={(e) => {
                setForm((f) => ({ ...f, query: e.target.value }));
                setFieldErrors((prev) => clearFieldError(prev, "query"));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none ${
                fieldErrors.query ? "border-danger focus:ring-danger/20" : "border-border"
              }`}
            />
            {fieldErrors.query && <span className="text-xs text-danger">{fieldErrors.query}</span>}
          </div>

          {/* Gợi ý nhanh */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, query: s }))}
                className="text-xs px-3 py-1 rounded-full border border-border hover:border-brand hover:text-brand transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-end">
            <div className="w-40">
              <Input
                label="Ngân sách (JPY)"
                type="number"
                min={0}
                placeholder="Vd: 3000"
                value={form.budget_jpy}
                onChange={(e) => setForm((f) => ({ ...f, budget_jpy: e.target.value }))}
              />
            </div>
            <div className="w-32">
              <Input
                label="Số lượng"
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={loading} className="mb-0.5">
              {loading ? "⏳ Đang phân tích..." : "🔍 Tìm & So Sánh"}
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <Card className="p-4 border-danger/30 bg-red-50">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="p-8 text-center">
          <p className="text-2xl mb-2">🔎</p>
          <p className="text-sm text-text-muted">Đang tìm kiếm trên Rakuten Japan và catalog nội bộ...</p>
          <p className="text-xs text-text-muted mt-1">Đang chấm điểm và tạo báo cáo AI...</p>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Tìm: <span className="font-medium text-text-primary">{result.query}</span></span>
            {result.keyword_jp && result.keyword_jp !== result.query && (
              <span>→ JP: <span className="font-mono text-brand">{result.keyword_jp}</span></span>
            )}
            <span className="ml-auto">{result.results.length} sản phẩm</span>
          </div>

          {/* Product cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {result.results.map((item, i) => (
              <ProductCard key={i} item={item} rank={i + 1} isTop={i === 0} />
            ))}
          </div>

          {/* AI Report */}
          {result.report && (
            <Card className="p-5">
              <p className="text-sm font-medium text-text-primary mb-2">💡 Phân tích AI</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                {result.report}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
