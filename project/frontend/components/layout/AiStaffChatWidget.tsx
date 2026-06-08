"use client";

/**
 * AI Staff Chat Widget — floating chat button + slide-in panel
 *
 * Hiển thị với mọi role. Dữ liệu trả về theo quyền:
 *   admin       → thấy tất cả đơn, tồn kho, giá gốc
 *   company     → chỉ thấy đơn/hóa đơn của công ty mình
 *   branch_*    → chỉ thấy đơn của chi nhánh mình
 *
 * spec: docs/sa/amendments/ai-staff-chat-widget.md
 * API: POST /api/proxy/ai/chat
 */

import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  suggestions?: string[];
  timestamp: string;
};

type SendResult = {
  reply: string;
  conversation_id: number;
  intent?: string;
  suggestions?: string[];
};

// ─── Suggested prompts theo role ─────────────────────────────────────────────

const PROMPTS_ADMIN = [
  "Tổng đơn hàng đang xử lý?",
  "Công nợ chưa thanh toán?",
  "Sản phẩm sắp hết hàng?",
  "Chuyến hàng đang vận chuyển?",
];

const PROMPTS_COMPANY = [
  "Đơn hàng của tôi đang ở đâu?",
  "Hóa đơn tháng này bao nhiêu?",
  "Sản phẩm nào còn hàng?",
  "Quy trình đặt hàng như thế nào?",
];

const PROMPTS_BRANCH = [
  "Đơn chi nhánh tôi đang xử lý?",
  "Có đơn nào chờ xác nhận không?",
  "Hàng nào còn tồn kho?",
  "Làm sao để đặt thêm hàng?",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function intentLabel(intent?: string) {
  const map: Record<string, string> = {
    ORDER_STATUS: "📦 Đơn hàng",
    INVOICE_INQUIRY: "🧾 Hóa đơn",
    PRICE_INQUIRY: "💴 Giá cả",
    INTERNAL_SEARCH: "🔍 Tìm kiếm",
    RAKUTEN_DISCOVER: "🛒 Rakuten",
    POLICY_QUESTION: "📋 Chính sách",
    GENERAL_CHAT: "💬 Trò chuyện",
  };
  return intent ? (map[intent] ?? intent) : null;
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function AiStaffChatWidget() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Suggested prompts theo role
  const prompts =
    user?.user_type === "admin"
      ? PROMPTS_ADMIN
      : user?.user_type === "company"
        ? PROMPTS_COMPANY
        : PROMPTS_BRANCH;

  // Lời chào khi mở lần đầu
  useEffect(() => {
    if (messages.length === 0) {
      const name =
        user?.user_type === "company"
          ? user?.company_name ?? "bạn"
          : user?.full_name ?? "bạn";
      setMessages([
        {
          id: "init",
          role: "assistant",
          content: `Xin chào ${name}! Tôi là AI nhân viên hỗ trợ. Bạn có thể hỏi tôi về đơn hàng, tồn kho, hóa đơn hoặc bất kỳ điều gì liên quan đến hệ thống.`,
          suggestions: prompts,
          timestamp: ts(),
        },
      ]);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input khi mở
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnread(0);
    }
  }, [open]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: ts(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/proxy/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const detail =
          (data.errors as { ai_chat?: string[] } | null)?.ai_chat?.[0] ??
          data.message ??
          "M0001";
        throw new Error(detail);
      }

      const result = data.data as SendResult;
      if (result.conversation_id) setConversationId(result.conversation_id);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.reply,
        intent: result.intent,
        suggestions: result.suggestions,
        timestamp: ts(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Nếu panel đang đóng → tăng unread badge
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      const code = err instanceof Error ? err.message : "M0001";
      const content =
        code === "API_OFFLINE"
          ? "Không kết nối được máy chủ API. Vui lòng kiểm tra mạng hoặc thử lại sau."
          : code === "M0101"
            ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
            : code.includes("ai_conversations") || code.includes("doesn't exist")
              ? "Hệ thống AI chưa sẵn sàng (thiếu migration DB). Liên hệ quản trị viên chạy migrate trên server."
              : "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content,
          timestamp: ts(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    setConversationId(null);
    const name =
      user?.user_type === "company"
        ? user?.company_name ?? "bạn"
        : user?.full_name ?? "bạn";
    setMessages([
      {
        id: "init-" + Date.now(),
        role: "assistant",
        content: `Cuộc trò chuyện mới bắt đầu. Xin chào ${name}!`,
        suggestions: prompts,
        timestamp: ts(),
      },
    ]);
  }

  return (
    <>
      {/* ── Slide-in panel ── */}
      {open && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Backdrop nhẹ */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-x-2 bottom-16 md:inset-x-auto md:right-4 md:bottom-20 md:w-[380px] top-16 md:top-auto max-h-none md:max-h-[calc(100vh-6rem)] flex flex-col bg-white rounded-2xl shadow-2xl border border-border pointer-events-auto overflow-hidden animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-brand to-purple-600 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-base">
                  🤖
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">AI Nhân viên</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Trực tuyến</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  title="Cuộc trò chuyện mới"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white/80 hover:text-white text-sm transition-colors"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-brand to-purple-600 text-white"
                        : "bg-surface-subtle text-text-body"
                    }`}
                  >
                    {msg.role === "assistant" ? "🤖" : "👤"}
                  </div>

                  <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                    {/* Intent badge */}
                    {msg.role === "assistant" && msg.intent && intentLabel(msg.intent) && (
                      <span className="inline-block mb-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-light text-brand border border-brand/20">
                        {intentLabel(msg.intent)}
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "assistant"
                          ? "bg-surface-subtle text-text-primary rounded-tl-sm"
                          : "bg-brand text-white rounded-tr-sm whitespace-pre-wrap"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ChatMessageContent content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Suggestions */}
                    {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => sendMessage(s)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-brand/30 text-brand hover:bg-brand-light transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-text-placeholder mt-1 px-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand to-purple-600 text-white flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <div className="bg-surface-subtle rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Hỏi về đơn hàng, tồn kho, hóa đơn..."
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl border border-border text-xs text-text-primary placeholder:text-text-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="px-3 py-2 rounded-xl bg-brand text-white text-xs font-medium disabled:opacity-40 hover:bg-brand/90 transition-colors shrink-0"
                >
                  Gửi
                </button>
              </div>
              <p className="text-[10px] text-text-placeholder mt-1.5 text-center">
                Enter để gửi · Shift+Enter xuống dòng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setUnread(0);
        }}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        title="AI Nhân viên hỗ trợ"
      >
        <span className="text-2xl">{open ? "✕" : "💬"}</span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
