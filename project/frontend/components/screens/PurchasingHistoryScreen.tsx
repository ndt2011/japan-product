"use client";

import { Button, Card, PageHeader } from "@/components/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface HistoryItem {
  id: number;
  query: string;
  keyword_jp?: string | null;
  budget_jpy?: number | null;
  qty?: number | null;
  result_count?: number;
  top_score?: number | null;
  created?: string | null;
}

interface HistoryDetail extends HistoryItem {
  results?: unknown[];
  report?: string;
  recommendation?: { name?: string; total_score?: number } | null;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export function PurchasingHistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<HistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/ai/purchasing/history?per_page=30");
      const data = await res.json();
      if (!data.success) {
        setError("Không tải được lịch sử.");
        return;
      }
      setItems(data.data?.items ?? []);
    } catch {
      setError("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/proxy/ai/purchasing/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelected(data.data as HistoryDetail);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="📋 Lịch sử Tư Vấn Thu Mua"
        subtitle="Xem lại các phiên tìm kiếm và so sánh sản phẩm trước đây"
        actions={
          <Link href="/purchasing">
            <Button variant="secondary" size="sm">← Tìm mới</Button>
          </Link>
        }
      />

      {error && (
        <Card className="p-4 border-danger/30 bg-red-50">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-center text-sm text-text-muted">Đang tải...</Card>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-muted mb-3">Chưa có phiên tìm kiếm nào.</p>
          <Link href="/purchasing">
            <Button size="sm">Bắt đầu tìm kiếm</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 hover:border-brand/40 transition-colors cursor-pointer"
              onClick={() => openDetail(item.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-text-primary">{item.query}</p>
                  {item.keyword_jp && item.keyword_jp !== item.query && (
                    <p className="text-xs text-text-muted font-mono mt-0.5">{item.keyword_jp}</p>
                  )}
                </div>
                <div className="text-right text-xs text-text-muted">
                  <p>{fmtDate(item.created)}</p>
                  <p className="mt-1">
                    {item.result_count ?? 0} SP
                    {item.top_score != null && ` · Top ${item.top_score.toFixed(1)}/10`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detailLoading && (
        <Card className="p-4 text-sm text-text-muted text-center">Đang tải chi tiết...</Card>
      )}

      {selected && !detailLoading && (
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{selected.query}</p>
              <p className="text-xs text-text-muted">{fmtDate(selected.created)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Đóng</Button>
          </div>
          {selected.recommendation?.name && (
            <p className="text-sm">
              Đề xuất: <span className="font-medium">{selected.recommendation.name}</span>
              {selected.recommendation.total_score != null && (
                <span className="text-brand ml-1">({selected.recommendation.total_score.toFixed(1)}/10)</span>
              )}
            </p>
          )}
          {selected.report && (
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed border-t border-border pt-3">
              {selected.report}
            </p>
          )}
          <Link href="/purchasing" className="inline-block">
            <Button size="sm" variant="secondary">Tìm lại yêu cầu tương tự</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
