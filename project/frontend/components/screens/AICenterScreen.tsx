"use client";

import { Badge, Button, Card } from "@/components/ui";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const suggestedPrompts = [
  "Phân tích xu hướng sản phẩm TPCN tháng 6/2026",
  "Tìm top 5 sản phẩm bán chạy trong tháng này",
  "Kiểm tra hàng tồn kho sắp hết và đề xuất đặt hàng",
  "Phân tích công nợ quá hạn và đề xuất xử lý",
];

const mockResponses = [
  "Tôi đã tìm được 3 sản phẩm TPCN phù hợp. Dưới đây là danh sách cùng thông tin giá nhập và xu hướng thị trường. (Demo — chờ API AI Product Search)",
  "Dựa trên dữ liệu tồn kho demo, có **4 sản phẩm** cần bổ sung:\n\n• Collagen DHC: còn 8 unit (min: 20)\n• Vitamin C Fancl: hết hàng\n• Omega-3 Otsuka: còn 5 unit (min: 15)",
  "Phân tích công nợ demo:\n\n• Tổng công nợ: 4.2 tỷ\n• Chưa thu: 1.8 tỷ (43%)\n\n⚠️ 2 đại lý quá hạn cần nhắc nhở.",
];

export function AICenterScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Xin chào! Tôi là AI Product Assistant (demo). Chờ tài liệu 2-101 và API AI Product Search để kết nối dữ liệu thật.",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIdx = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput("");

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

    await new Promise((r) => setTimeout(r, 1000));

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: mockResponses[responseIdx.current % mockResponses.length],
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    responseIdx.current++;
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <aside className="w-64 shrink-0">
        <Card className="p-4 h-full flex flex-col overflow-hidden">
          <p className="text-xs text-text-placeholder mb-2">Câu hỏi gợi ý:</p>
          <div className="space-y-2 overflow-y-auto flex-1">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-text-body hover:bg-brand-light hover:text-brand border border-border hover:border-brand/30 transition-all leading-relaxed"
              >
                {prompt}
              </button>
            ))}
          </div>
          <Badge variant="info" className="mt-3 justify-center">
            Chờ docs 2-101
          </Badge>
        </Card>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Card className="px-4 py-3 mb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand to-purple-accent rounded-xl flex items-center justify-center text-white">
              🤖
            </div>
            <div>
              <p className="text-sm text-text-primary font-medium">AI Product Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-success">Demo mode</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessages((prev) => [prev[0]])}>
            🗑 Xóa chat
          </Button>
        </Card>

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
              <div className={`flex-1 max-w-[75%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-white border border-border text-text-body"
                      : "bg-brand text-white"
                  }`}
                >
                  {msg.content}
                </div>
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
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-text-placeholder rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
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
              placeholder="Nhập câu hỏi về sản phẩm, tồn kho... (Enter để gửi)"
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border border-border text-xs text-text-primary placeholder:text-text-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <Button size="sm" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              ↑
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
