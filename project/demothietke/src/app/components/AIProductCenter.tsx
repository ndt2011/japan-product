import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Badge } from "./ui";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: SavedProduct[];
  timestamp: string;
};

type SavedProduct = {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  image?: string;
  saved?: boolean;
};

const suggestedPrompts = [
  "Phân tích xu hướng sản phẩm điện tử tháng 12/2024",
  "Tìm top 5 sản phẩm bán chạy trong tháng này",
  "Kiểm tra hàng tồn kho sắp hết và đề xuất đặt hàng",
  "Phân tích công nợ quá hạn và đề xuất xử lý",
  "So sánh giá nhập từ các nhà cung cấp",
];

const mockProducts: SavedProduct[] = [
  { id: "p1", name: "MacBook Pro M4 14\"", price: "45.990.000đ", category: "Laptop", description: "Chip M4 Pro, RAM 24GB, SSD 512GB, pin 22h. Màn hình Liquid Retina XDR." },
  { id: "p2", name: "iPhone 16 Pro Max 256GB", price: "34.990.000đ", category: "Điện thoại", description: "Chip A18 Pro, camera 48MP, Dynamic Island, sạc 45W." },
  { id: "p3", name: "Sony WH-1000XM6", price: "9.490.000đ", category: "Âm thanh", description: "Chống ồn cấp cao, 40h pin, kết nối đa điểm, LDAC." },
];

const mockResponses = [
  {
    text: "Tôi đã tìm được 3 sản phẩm phù hợp với yêu cầu của bạn. Dưới đây là danh sách sản phẩm cùng với thông tin chi tiết về giá nhập, đặc điểm kỹ thuật và xu hướng thị trường:",
    products: mockProducts,
  },
  {
    text: "Dựa trên phân tích dữ liệu tồn kho hiện tại, tôi thấy có **6 sản phẩm** đang ở mức tồn thấp cần bổ sung:\n\n• iPhone 15 Pro Max: còn 6 unit (min: 10) — cần đặt thêm 20 unit\n• Sony WH-1000XM5: hết hàng (0 unit) — cần đặt thêm 15 unit\n• Samsung Galaxy S24 Ultra: còn 6 unit (min: 10) — cần đặt 15 unit\n\nTổng ngân sách ước tính: **~2.1 tỷ đồng**. Bạn muốn tôi tạo phiếu đặt hàng ngay không?",
  },
  {
    text: "Phân tích công nợ tháng 12/2024:\n\n📊 **Tổng quan:**\n• Tổng công nợ: 2.08 tỷ đồng\n• Đã thu: 860 triệu (41%)\n• Chưa thu: 1.22 tỷ (59%)\n\n⚠️ **Quá hạn (cần xử lý ngay):**\n• Đại Lý Miền Nam: 150 triệu — quá hạn 5 ngày\n• CellphoneS: 50 triệu — quá hạn 2 ngày\n\n✅ **Đề xuất:** Gửi nhắc nhở tự động cho 2 đại lý trên và lên lịch cuộc gọi follow-up.",
  },
];

export function AIProductCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Xin chào! Tôi là AI Product Assistant, sẵn sàng hỗ trợ bạn phân tích sản phẩm, theo dõi tồn kho, đề xuất đặt hàng và nhiều hơn nữa. Hãy nhập câu hỏi hoặc chọn một gợi ý bên dưới!",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "saved">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIdx = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msgText,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const response = mockResponses[responseIdx.current % mockResponses.length];
    responseIdx.current++;

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.text,
      products: response.products,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  function saveProduct(p: SavedProduct) {
    setSavedProducts((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev;
      return [...prev, { ...p, saved: true }];
    });
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel - Saved */}
      <aside className="w-64 shrink-0 flex flex-col gap-3">
        <Card className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-1 mb-3">
            {(["chat", "saved"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSidebarTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${sidebarTab === t ? "bg-[#2563EB] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}
              >
                {t === "chat" ? "💬 Gợi ý" : `📦 Đã lưu (${savedProducts.length})`}
              </button>
            ))}
          </div>

          {sidebarTab === "chat" && (
            <div className="space-y-2 overflow-y-auto flex-1">
              <p className="text-xs text-[#9CA3AF] mb-2">Câu hỏi gợi ý:</p>
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-[#374151] hover:bg-[#EFF6FF] hover:text-[#2563EB] border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all leading-relaxed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {sidebarTab === "saved" && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {savedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">📦</p>
                  <p className="text-xs text-[#9CA3AF]">Chưa có sản phẩm được lưu</p>
                </div>
              ) : (
                savedProducts.map((p) => (
                  <div key={p.id} className="p-3 border border-[#E5E7EB] rounded-xl">
                    <p className="text-xs text-[#111827] leading-tight">{p.name}</p>
                    <p className="text-xs text-[#2563EB] mt-0.5">{p.price}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="info">{p.category}</Badge>
                      <Button variant="ghost" size="sm" className="text-xs px-2 py-0.5 h-auto">
                        + Nhập kho
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Card className="px-4 py-3 mb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-xl flex items-center justify-center text-white text-base">
              🤖
            </div>
            <div>
              <p className="text-sm text-[#111827]">AI Product Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
                <span className="text-xs text-[#16A34A]">Online · GPT-4 Turbo</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMessages((prev) => [prev[0]])}>
              🗑 Xóa chat
            </Button>
          </div>
        </Card>

        {/* Messages */}
        <Card className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${msg.role === "assistant" ? "bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white" : "bg-[#F3F4F6] text-[#374151]"}`}>
                {msg.role === "assistant" ? "🤖" : "👤"}
              </div>
              <div className={`flex-1 max-w-[75%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === "assistant" ? "bg-white border border-[#E5E7EB] text-[#374151]" : "bg-[#2563EB] text-white"}`}>
                  {msg.content}
                </div>
                {msg.products && (
                  <div className="mt-3 grid grid-cols-1 gap-2 w-full">
                    <p className="text-xs text-[#9CA3AF]">Sản phẩm tìm được:</p>
                    {msg.products.map((p) => (
                      <div key={p.id} className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#F8FAFC] rounded-lg flex items-center justify-center text-base shrink-0">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#111827]">{p.name}</p>
                          <p className="text-xs text-[#2563EB] mt-0.5">{p.price}</p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-2">{p.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="info">{p.category}</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-0.5 h-auto"
                              onClick={() => saveProduct(p)}
                            >
                              {savedProducts.some((x) => x.id === p.id) ? "✓ Đã lưu" : "+ Lưu"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-[#9CA3AF] mt-1 px-1">{msg.timestamp}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] text-white flex items-center justify-center text-sm shrink-0">
                🤖
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </Card>

        {/* Input */}
        <Card className="p-3 mt-3 shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Nhập link website, mô tả sản phẩm hoặc câu hỏi... (Enter để gửi)"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#111827] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Button variant="ghost" size="sm" className="text-xs px-2">📎</Button>
              <Button
                size="sm"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-3"
              >
                ↑
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 px-1">
            <span className="text-xs text-[#9CA3AF]">Gợi ý nhanh:</span>
            {["📦 Phân tích SP", "📊 Tồn kho", "💰 Công nợ"].map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s.replace(/^[^ ]+ /, ""))}
                className="text-xs text-[#2563EB] hover:underline"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
