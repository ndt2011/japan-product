"use client";

import { AICatalogSearchPanel } from "@/components/screens/AICatalogSearchPanel";
import { Badge, Button, Card } from "@/components/ui";
import { translateMessage } from "@/lib/messages";
import type { AiSearchItem } from "@/types/api";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchMode = "web" | "catalog";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: AiSearchItem[];
  timestamp: string;
};

const suggestedPrompts = [
  "DHC",
  "mỹ phẩm tốt",
  "collagen uống nhật",
  "vitamin c nhật bản",
  "コラーゲン サプリ",
  "ビタミンC ファンケル",
];

function itemKey(item: AiSearchItem, index: number) {
  return item.external_id ?? `${item.product_name_jp}-${index}`;
}

function WebSearchPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Nhập từ khóa sản phẩm (tiếng Nhật hoặc Việt) để AI tìm trên Rakuten/Amazon JP. Chọn sản phẩm và gửi duyệt cho JP Agency.",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Record<string, AiSearchItem>>({});
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function pollSession(id: number, keyword: string, maxAttempts = 90) {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(`/api/proxy/ai/search/${id}`);
      const data = await res.json();

      if (!data.success && !["M0201", "M0202", "M0206", "M0207"].includes(data.message)) {
        throw new Error(data.message ?? "M0001");
      }

      const session = data.data?.session;
      if (!session) throw new Error("M0002");

      if (session.status === "processing" && data.message !== "M0202") {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (session.status === "timeout" || session.status === "failed" || data.message === "M0202") {
        return { text: translateMessage("M0202"), products: [] as AiSearchItem[] };
      }

      if (data.message === "M0206" || data.message === "M0207") {
        return {
          text: translateMessage(data.message),
          products: [] as AiSearchItem[],
        };
      }

      if (data.message === "M0201" || !session.items?.length) {
        return {
          text: translateMessage("M0201"),
          products: [] as AiSearchItem[],
        };
      }

      // Hiển thị keyword JP đã dùng nếu khác keyword gốc (dịch từ VI → JP)
      const keywordJp = session.keyword_jp as string | undefined;
      const keywordLabel =
        keywordJp && keywordJp !== keyword
          ? `"${keyword}" → 🇯🇵 ${keywordJp}`
          : `"${keyword}"`;

      return {
        text: `Tìm thấy ${session.items.length} sản phẩm cho ${keywordLabel}. Chọn sản phẩm cần gửi duyệt:`,
        products: session.items as AiSearchItem[],
      };
    }

    return { text: translateMessage("M0202"), products: [] as AiSearchItem[] };
  }

  async function sendMessage(text?: string) {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput("");
    setError("");
    setSelected({});
    setSessionId(null);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: msgText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setLoading(true);

    try {
      const startRes = await fetch("/api/proxy/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: msgText }),
      });
      const startData = await startRes.json();

      if (!startRes.ok || !startData.success) {
        setError(translateMessage(startData.message ?? "M0001"));
        return;
      }

      const id = startData.data?.session?.id as number;
      setSessionId(id);

      const result = await pollSession(id, msgText);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.text,
          products: result.products,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setError("Không thể tìm kiếm AI. Kiểm tra API backend.");
    } finally {
      setLoading(false);
    }
  }

  function toggleProduct(item: AiSearchItem, index: number) {
    const key = itemKey(item, index);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = item;
      return next;
    });
  }

  async function submitForApproval() {
    const items = Object.values(selected);
    if (items.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/proxy/ai/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          items: items.map((item) => ({
            product_name_jp: item.product_name_jp,
            product_name_vn: item.product_name_vn,
            image_url: item.image_url,
            price_jpy: item.price_jpy,
            source_url: item.source_url,
            source_platform: item.source_platform,
            description: item.description,
            suggested_category_id: item.suggested_category_id,
            suggested_category_name: item.suggested_category_name,
            usage_instructions: item.usage_instructions,
            spec: item.spec,
            data_source: item.data_source,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(translateMessage(data.message ?? "M0001"));
        return;
      }

      setSelected({});
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: translateMessage("M0203") + ` (${items.length} sản phẩm)`,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setError("Không gửi được duyệt. Kiểm tra API.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="w-64 shrink-0">
        <Card className="p-4 h-full flex flex-col overflow-hidden">
          <p className="text-xs text-text-placeholder mb-2">Từ khóa gợi ý:</p>
          <div className="space-y-2 overflow-y-auto flex-1">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-text-body hover:bg-brand-light hover:text-brand border border-border hover:border-brand/30 transition-all leading-relaxed"
              >
                {prompt}
              </button>
            ))}
          </div>
          <Link href="/admin/ai-candidates" className="mt-3">
            <Button variant="outline" size="sm" className="w-full">
              Duyệt sản phẩm AI →
            </Button>
          </Link>
        </Card>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Card className="px-4 py-3 mb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand to-purple-accent rounded-xl flex items-center justify-center text-white">
              🤖
            </div>
            <div>
              <p className="text-sm text-text-primary font-medium">AI Product Search</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-success">API kết nối</span>
              </div>
            </div>
          </div>
          {selectedCount > 0 && (
            <Button size="sm" onClick={submitForApproval} disabled={submitting}>
              {submitting ? "Đang gửi..." : `Gửi duyệt (${selectedCount})`}
            </Button>
          )}
        </Card>

        {error && (
          <Card className="p-3 mb-3 text-sm text-danger border-danger/30 bg-red-50">{error}</Card>
        )}

        <Card className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-brand to-purple-accent text-white"
                    : "bg-surface-subtle text-text-body"
                }`}
              >
                {msg.role === "assistant" ? "🤖" : "👤"}
              </div>
              <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-white border border-border text-text-body"
                      : "bg-brand text-white"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2 w-full">
                    {msg.products.map((p, index) => {
                      const key = itemKey(p, index);
                      const isSelected = Boolean(selected[key]);
                      return (
                        <div
                          key={key}
                          className={`bg-white border rounded-xl p-3 flex items-start gap-3 ${
                            isSelected ? "border-brand ring-2 ring-brand/20" : "border-border"
                          }`}
                        >
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-surface-muted rounded-lg flex items-center justify-center shrink-0">
                              📦
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-primary font-medium">{p.product_name_jp}</p>
                            {p.product_name_vn && (
                              <p className="text-xs text-text-body mt-0.5">{p.product_name_vn}</p>
                            )}
                            {p.price_jpy != null && (
                              <p className="text-xs text-brand mt-0.5">Giá gốc ¥{p.price_jpy.toLocaleString("ja-JP")}</p>
                            )}
                            {p.suggested_category_name && (
                              <p className="text-xs text-text-muted mt-0.5">Gợi ý: {p.suggested_category_name}</p>
                            )}
                            {p.spec && <p className="text-xs text-text-muted mt-0.5">Quy cách: {p.spec}</p>}
                            {p.description && (
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{p.description}</p>
                            )}
                            {p.usage_instructions && (
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">Cách dùng: {p.usage_instructions}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {p.data_source === "rakuten_api" ? (
                                <Badge variant="success">Rakuten (giá thật)</Badge>
                              ) : p.data_source === "openai" || p.data_source === "openai_guess" ? (
                                <Badge variant="warning">AI gợi ý (chưa có link/ảnh)</Badge>
                              ) : null}
                              {p.source_platform && <Badge variant="info">{p.source_platform}</Badge>}
                              {p.source_url && (
                                <a
                                  href={p.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-brand hover:underline"
                                >
                                  Link nguồn
                                </a>
                              )}
                              <Button
                                variant={isSelected ? "primary" : "outline"}
                                size="sm"
                                type="button"
                                onClick={() => toggleProduct(p, index)}
                              >
                                {isSelected ? "✓ Đã chọn" : "Chọn"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-text-placeholder mt-1 px-1">{msg.timestamp}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand to-purple-accent text-white flex items-center justify-center text-sm">
                🤖
              </div>
              <div className="bg-white border border-border rounded-2xl px-4 py-3">
                <p className="text-xs text-text-muted">Đang tìm sản phẩm...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </Card>

        <Card className="p-3 mt-3 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Nhập từ khóa sản phẩm (VD: コラーゲン, vitamin C...)"
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border border-border text-xs text-text-primary placeholder:text-text-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <Button size="sm" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              Tìm
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AICenterScreen() {
  const [mode, setMode] = useState<SearchMode>("web");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("web")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === "web"
              ? "bg-brand text-white"
              : "bg-white border border-border text-text-body hover:border-brand/40"
          }`}
        >
          Khám phá web (Rakuten/Amazon)
        </button>
        <button
          type="button"
          onClick={() => setMode("catalog")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            mode === "catalog"
              ? "bg-brand text-white"
              : "bg-white border border-border text-text-body hover:border-brand/40"
          }`}
        >
          Tìm catalog nội bộ
        </button>
      </div>

      {mode === "web" ? <WebSearchPanel /> : <AICatalogSearchPanel />}
    </div>
  );
}
