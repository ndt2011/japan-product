"use client";

import { Button, Card } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { AiCatalogSearchItem } from "@/types/api";
import Link from "next/link";
import { useState } from "react";

const catalogPrompts = [
  "collagen",
  "vitamin",
  "コラーゲン",
  "DHC",
  "thực phẩm chức năng",
];

export function AICatalogSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AiCatalogSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  async function search(text?: string) {
    const q = (text ?? query).trim();
    if (!q || loading) return;

    setQuery(text ?? query);
    setLoading(true);
    setError("");
    setLastQuery(q);

    try {
      const res = await fetch("/api/proxy/ai/product-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 15 }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        setResults([]);
        return;
      }

      const items = (data.data?.items ?? []) as AiCatalogSearchItem[];
      setResults(items);

      if (data.message === "M0201" || items.length === 0) {
        setError(translateMessage("M0201"));
      }
    } catch {
      setError("API_OFFLINE");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="w-64 shrink-0">
        <Card className="p-4 h-full flex flex-col">
          <p className="text-xs text-text-placeholder mb-2">Gợi ý tìm catalog:</p>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {catalogPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  search(prompt);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-text-body hover:bg-brand-light hover:text-brand border border-border transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3 leading-relaxed">
            Tìm trong sản phẩm đã có trên hệ thống. Có OpenAI key → semantic search; không có → tìm theo từ khóa.
          </p>
        </Card>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Card className="p-3 mb-3 shrink-0 flex gap-2 items-end">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="VD: thuốc bổ gan, collagen, ビタミン..."
            className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <Button onClick={() => search()} disabled={!query.trim() || loading}>
            {loading ? "Đang tìm..." : "Tìm catalog"}
          </Button>
        </Card>

        {error && (
          <Card className="p-3 mb-3 text-sm text-danger border-danger/30 bg-red-50">{error}</Card>
        )}

        {lastQuery && !loading && results.length > 0 && (
          <p className="text-xs text-text-muted mb-2 px-1">
            {results.length} kết quả cho &quot;{lastQuery}&quot;
          </p>
        )}

        <Card className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading ? (
            <p className="text-sm text-text-muted text-center py-12">Đang tìm trong catalog...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">
              Nhập từ khóa để tìm sản phẩm trong hệ thống.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-xl p-3 flex gap-3 hover:border-brand/40 transition-colors"
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-surface-muted rounded-lg flex items-center justify-center shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.product_name}</p>
                    {item.product_name_jp && (
                      <p className="text-xs text-text-muted truncate">{item.product_name_jp}</p>
                    )}
                    <p className="text-xs font-mono text-text-placeholder mt-0.5">{item.product_cd}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                      {item.price_vnd != null && (
                        <span className="text-brand font-medium">
                          {Number(item.price_vnd).toLocaleString("vi-VN")} ₫
                        </span>
                      )}
                      {item.cost_jpy != null && (
                        <span className="text-text-muted">¥{item.cost_jpy.toLocaleString("ja-JP")}</span>
                      )}
                    </div>
                    {item.category && (
                      <p className="text-xs text-text-muted mt-1">{item.category}</p>
                    )}
                    <Link
                      href={`/products/${item.id}`}
                      className="text-xs text-brand hover:underline mt-2 inline-block"
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
