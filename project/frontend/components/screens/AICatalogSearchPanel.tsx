"use client";

import { Badge, Button, Card } from "@/components/ui";
import { AI_CATALOG_SEARCH_PROMPTS } from "@/lib/ai-catalog-prompts";
import { translateMessage } from "@/lib/messages";
import type { AiCatalogSearchItem } from "@/types/api";
import Link from "next/link";
import { useState } from "react";

const searchModeLabel: Record<string, string> = {
  hybrid: "Hybrid (semantic + keyword)",
  keyword: "Từ khóa",
  semantic: "Semantic",
};

export function AICatalogSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AiCatalogSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [expandedQuery, setExpandedQuery] = useState("");
  const [searchMode, setSearchMode] = useState("");

  async function search(text?: string) {
    const q = (text ?? query).trim();
    if (!q || loading) return;

    setQuery(text ?? query);
    setLoading(true);
    setError("");
    setLastQuery(q);
    setSearchMode("");

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
      setExpandedQuery((data.data?.expanded_query as string) ?? "");
      setSearchMode((data.data?.search_mode as string) ?? "");
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
      <aside className="w-72 shrink-0">
        <Card className="p-4 h-full flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Gợi ý tìm kiếm</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Hệ thống dạy AI bằng ví dụ: query tiếng Việt được GPT mở rộng sang Nhật/Anh trước khi tìm trong catalog.
            </p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {AI_CATALOG_SEARCH_PROMPTS.map((prompt) => (
              <button
                key={prompt.query}
                type="button"
                onClick={() => {
                  setQuery(prompt.query);
                  search(prompt.query);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs border border-border hover:border-brand/50 hover:bg-brand-light/40 transition-all"
              >
                <p className="font-medium text-text-primary">{prompt.label}</p>
                <p className="text-text-muted mt-0.5 truncate">&quot;{prompt.query}&quot;</p>
                {prompt.hint && (
                  <p className="text-text-placeholder mt-1 text-[11px]">{prompt.hint}</p>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-surface-subtle p-3 text-[11px] text-text-muted leading-relaxed space-y-1">
            <p className="font-medium text-text-body">Cách hoạt động</p>
            <p>1. GPT mở rộng từ khóa (few-shot)</p>
            <p>2. Tìm semantic + keyword (hybrid)</p>
            <p>3. Ưu tiên sản phẩm có <code className="text-[10px]">name_vi</code></p>
          </div>
        </Card>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Card className="p-3 mb-3 shrink-0 flex gap-2 items-end">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="VD: thuốc bổ gan, vitamin c nhật bản, ビタミン..."
            className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <Button onClick={() => search()} disabled={!query.trim() || loading}>
            {loading ? "Đang tìm..." : "Tìm catalog"}
          </Button>
        </Card>

        {error && (
          <Card className="p-3 mb-3 text-sm text-danger border-danger/30 bg-red-50">{error}</Card>
        )}

        {lastQuery && !loading && (
          <div className="text-xs text-text-muted mb-2 px-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {results.length} kết quả cho &quot;{lastQuery}&quot;
              </span>
              {searchMode && (
                <Badge variant={searchMode === "hybrid" ? "primary" : "gray"}>
                  {searchModeLabel[searchMode] ?? searchMode}
                </Badge>
              )}
            </div>
            {expandedQuery && expandedQuery !== lastQuery && (
              <p className="line-clamp-3 rounded-lg bg-surface-subtle px-2 py-1.5">
                <span className="font-medium text-text-body">GPT mở rộng: </span>
                {expandedQuery}
              </p>
            )}
          </div>
        )}

        <Card className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading ? (
            <p className="text-sm text-text-muted text-center py-12">Đang tìm trong catalog...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-12">
              Chọn gợi ý bên trái hoặc nhập từ khóa tiếng Việt / Nhật.
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
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.name_vi || item.product_name}
                    </p>
                    {item.product_name_jp && (
                      <p className="text-xs text-text-muted truncate">{item.product_name_jp}</p>
                    )}
                    {item.description_vi && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">{item.description_vi}</p>
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
