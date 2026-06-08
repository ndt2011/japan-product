# AI Nhân viên — Conversation Upgrade Spec

**Mã:** AI-CONV-001  
**Phiên bản:** 1.0  
**Ngày:** 2026-06-08  
**Liên quan:** docs/sa/amendments/ai-search-improvement.md, docs/sa/AI_Search_Implementation.md

---

## 1. Tổng quan

Nâng cấp AI từ "công cụ tìm kiếm" → **"nhân viên ảo thông minh"** có khả năng:

- Hiểu câu hỏi bằng tiếng Việt, tiếng Nhật, tiếng Anh
- Tự nhận biết *loại câu hỏi* → chọn hành động phù hợp (tìm Rakuten / tìm catalog nội bộ / trả lời trực tiếp)
- Nhớ ngữ cảnh trong phiên chat
- Đưa ra thông tin chi tiết, đúng nghiệp vụ

---

## 2. Kiến trúc

```
User Message
    │
    ▼
[Intent Classifier] ─── GPT-4o (system prompt nhân viên)
    │
    ├── INTERNAL_SEARCH   → POST /ai/product-search (embedding)
    ├── RAKUTEN_DISCOVER  → POST /ai/search (Rakuten API via Queue)
    ├── PRICE_INQUIRY     → Query products + exchange_rates
    ├── ORDER_STATUS      → Query orders (by user role)
    ├── INVOICE_INQUIRY   → Query invoices
    ├── POLICY_QUESTION   → Answer từ knowledge base tĩnh
    └── GENERAL_CHAT      → GPT-4o trả lời trực tiếp (không gọi API ngoài)
```

---

## 3. Intent Classification

### 3.1 Bảng ý định (Intent)

| Intent | Từ khóa trigger (ví dụ) | Hành động |
|--------|------------------------|-----------|
| `INTERNAL_SEARCH` | "tìm", "có không", "catalog", "sản phẩm nào", "kiếm" | POST /ai/product-search |
| `RAKUTEN_DISCOVER` | "sản phẩm mới", "tìm trên Rakuten", "muốn nhập thêm", "SP nào hot" | POST /ai/search → Queue |
| `PRICE_INQUIRY` | "giá bao nhiêu", "bán giá gì", "tỷ giá", "phí", "fee" | DB lookup + format |
| `ORDER_STATUS` | "đơn hàng", "đơn số", "tình trạng đơn", "đang ở đâu" | orders API |
| `INVOICE_INQUIRY` | "hóa đơn", "công nợ", "chưa thanh toán", "nợ bao nhiêu" | invoices API |
| `POLICY_QUESTION` | "phí dịch vụ bao nhiêu %", "điều khoản", "quy trình", "bao lâu" | knowledge base |
| `GENERAL_CHAT` | chào hỏi, hỏi không liên quan hệ thống | GPT-4o direct |

### 3.2 System Prompt mẫu (GPT-4o)

```
Bạn là nhân viên tư vấn của công ty vận chuyển hàng hóa Nhật-Việt.
Nhiệm vụ của bạn: tư vấn sản phẩm chức năng thực phẩm Nhật Bản cho đại lý Việt Nam.

Kiến thức của bạn:
- Phí dịch vụ mặc định: 5% (có thể khác theo sản phẩm)
- Tỷ giá JPY/VND: lấy từ hệ thống, cập nhật hàng ngày
- Quy trình đặt hàng: Đại lý tạo đơn → Admin xác nhận → Đóng hàng → Giao hàng
- Thời gian giao hàng thông thường: 7-14 ngày từ Nhật về Việt Nam
- Hàng hóa: thực phẩm chức năng, dược phẩm OTC, mỹ phẩm Nhật

Khi người dùng hỏi về sản phẩm cụ thể → tìm trong catalog nội bộ trước.
Khi hỏi sản phẩm mới chưa có → đề nghị tìm trên Rakuten Ichiba.
Khi hỏi đơn hàng/hóa đơn → truy vấn dữ liệu người dùng hiện tại.
Luôn trả lời bằng cùng ngôn ngữ người dùng dùng.
Nếu không chắc → hỏi lại để làm rõ, đừng đoán mò.
```

---

## 4. Database Schema mới

### 4.1 Bảng `ai_conversations`

```sql
CREATE TABLE ai_conversations (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id    VARCHAR(36) NOT NULL,          -- UUID phiên chat
    user_type     VARCHAR(50) NOT NULL,           -- admin / company / branch_manager / branch_staff
    user_id       BIGINT UNSIGNED NOT NULL,
    title         VARCHAR(255) NULL,              -- Auto-generated từ tin nhắn đầu
    created       DATETIME NOT NULL,
    modified      DATETIME NOT NULL,
    INDEX idx_session (session_id),
    INDEX idx_user (user_type, user_id)
);
```

### 4.2 Bảng `ai_messages`

```sql
CREATE TABLE ai_messages (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    role            ENUM('user','assistant','tool') NOT NULL,
    content         TEXT NOT NULL,
    intent          VARCHAR(50) NULL,             -- Detected intent
    tool_calls      JSON NULL,                    -- Tool calls made
    tool_results    JSON NULL,                    -- Tool results returned
    tokens_used     INT UNSIGNED NULL,
    created         DATETIME NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id),
    INDEX idx_conversation (conversation_id)
);
```

---

## 5. API Contract

### 5.1 POST /ai/chat

**Request:**
```json
{
  "conversation_id": null,          // null = tạo mới
  "message": "Cho tôi xem sản phẩm bổ gan Nhật",
  "language": "vi"                  // vi / ja / en (optional, auto-detect)
}
```

**Response:**
```json
{
  "conversation_id": 42,
  "message_id": 103,
  "reply": "Tôi tìm thấy 3 sản phẩm bổ gan trong catalog của chúng tôi:",
  "intent": "INTERNAL_SEARCH",
  "data": {
    "products": [
      {
        "id": 12,
        "product_name": "オルニチン 肝臓エキス",
        "product_name_vi": "Viên bổ gan Ornithine",
        "selling_price_jpy": 3200,
        "price_vnd": 890000,
        "image_url": "..."
      }
    ]
  },
  "suggestions": [
    "Xem chi tiết sản phẩm này",
    "Tìm thêm sản phẩm bổ gan trên Rakuten",
    "Tạo đơn hàng ngay"
  ]
}
```

### 5.2 GET /ai/conversations

Trả về lịch sử phiên chat của user hiện tại (phân trang, mới nhất trước).

### 5.3 GET /ai/conversations/{id}/messages

Trả về toàn bộ tin nhắn trong 1 phiên chat.

---

## 6. Intent Handler Logic

### 6.1 INTERNAL_SEARCH

```php
// Gọi AiProductSearchController::search()
// Trả về top-5 sản phẩm từ catalog nội bộ
// Kèm giá VND tính từ tỷ giá hiện tại
```

### 6.2 RAKUTEN_DISCOVER

```php
// Dispatch AiProductSearchJob (async)
// Return session_id, frontend poll status
// Khi COMPLETED: trả về danh sách candidates
```

### 6.3 PRICE_INQUIRY

```php
// Tìm sản phẩm theo tên
// Lấy tỷ giá hiện tại từ exchange_rates
// Tính: price_vnd = selling_price_jpy × rate × (1 + fee_rate)
// Format: "Sản phẩm X giá ¥3,200 → tương đương ~890,000 VND (bao gồm phí 5%)"
```

### 6.4 ORDER_STATUS

```php
// Nếu company/branch → chỉ trả đơn của họ
// Nếu admin → có thể tra theo mã đơn hoặc tên công ty
// Trả về: order_no, status (label tiếng Việt), created_at, expected_date
```

### 6.5 POLICY_QUESTION

Knowledge base tĩnh (hardcoded trong system prompt + có thể mở rộng từ DB):

| Câu hỏi mẫu | Câu trả lời mẫu |
|---|---|
| Phí dịch vụ bao nhiêu? | Phí dịch vụ mặc định 5% trên giá bán. Một số sản phẩm có thể khác. |
| Giao hàng bao lâu? | Từ 7-14 ngày sau khi đơn được xác nhận và đóng hàng. |
| Đặt tối thiểu bao nhiêu? | Không có số lượng tối thiểu. Đặt từ 1 sản phẩm. |
| Thanh toán thế nào? | Chuyển khoản ngân hàng sau khi nhận hóa đơn. |

---

## 7. Quy tắc hành vi nhân viên ảo

### 7.1 Ưu tiên ngữ cảnh

1. **Nhớ ngữ cảnh phiên** — Nếu user hỏi "sản phẩm đó giá bao nhiêu" sau khi đã tìm một sản phẩm → biết "sản phẩm đó" là cái gì
2. **Phân biệt role** — Admin thấy giá vốn + lợi nhuận; Đại lý/Chi nhánh chỉ thấy giá bán
3. **Ưu tiên tìm catalog nội bộ trước** → nếu không có mới đề nghị tìm Rakuten

### 7.2 Trả lời chi tiết

- Không trả lời cụt lủn "Không tìm thấy" → phải gợi ý bước tiếp theo
- Không bịa thông tin → nếu không chắc phải nói rõ "Tôi cần kiểm tra lại..."
- Format số tiền đúng: `¥3,200` (JPY), `890.000 ₫` (VND)
- Luôn kèm **suggestions** (3 gợi ý hành động tiếp theo)

### 7.3 Giới hạn

- Không thực hiện hành động thay user (không tạo đơn, không xác nhận) → chỉ tư vấn và link đến màn hình tương ứng
- Không tiết lộ giá vốn cho non-admin
- Không trả lời câu hỏi hoàn toàn ngoài phạm vi hệ thống (chính trị, y tế, etc.)

---

## 8. Frontend — Màn hình 2-102_AI_Chat

### 8.1 Layout

```
┌─────────────────────────────────────────────┐
│ 🤖 Trợ lý AI Nhật-Việt          [Lịch sử] │
├─────────────────────────────────────────────┤
│                                             │
│  [Avatar] Xin chào! Tôi có thể giúp bạn   │
│           tìm sản phẩm, kiểm tra giá,      │
│           hoặc theo dõi đơn hàng.          │
│                                             │
│           ┌─────────────────────────────┐  │
│           │ [Card sản phẩm] [Card đơn]  │  │
│           └─────────────────────────────┘  │
│                                             │
│  [User] Tìm cho tôi sản phẩm bổ gan         │
│                                             │
│  [Avatar] Tôi tìm thấy 3 sản phẩm...       │
│  [Suggestions]: Xem chi tiết | Tìm Rakuten │
│                                             │
├─────────────────────────────────────────────┤
│  [Nhập tin nhắn...            ] [Gửi ▶]   │
└─────────────────────────────────────────────┘
```

### 8.2 Components

| No | Tên | Loại | Ghi chú |
|----|-----|------|---------|
| 1 | Khung chat | container | Scroll, sticky input |
| 2 | Bubble user | div | Right-aligned, màu primary |
| 3 | Bubble assistant | div | Left-aligned, icon robot |
| 4 | Card sản phẩm inline | card | Ảnh, tên JP+VI, giá |
| 5 | Suggestion chips | button[] | Gợi ý hành động, max 3 |
| 6 | Input nhắn tin | textarea | Enter = gửi, Shift+Enter = xuống dòng |
| 7 | Nút Gửi | button | Disabled khi rỗng / đang xử lý |
| 8 | Indicator "đang gõ" | animation | 3 chấm nhấp nhô |
| 9 | Lịch sử hội thoại | sidebar | List conversations, click để mở |

---

## 9. Backend Tasks

| ID | Mô tả | Priority | Estimate |
|----|-------|----------|---------|
| AI-BE-001 | Migration: tạo ai_conversations + ai_messages | HIGH | 2h |
| AI-BE-002 | AiConversationController: POST /ai/chat, GET /ai/conversations, GET /ai/conversations/{id}/messages | HIGH | 1 ngày |
| AI-BE-003 | IntentClassifier service: classify message → intent | HIGH | 1 ngày |
| AI-BE-004 | Handler cho từng intent (INTERNAL_SEARCH, PRICE_INQUIRY, ORDER_STATUS, etc.) | HIGH | 2 ngày |
| AI-BE-005 | System prompt builder (role-aware: admin / company / branch) | MED | 4h |
| AI-BE-006 | Context builder: load last N messages vào GPT conversation | MED | 4h |

## 10. Frontend Tasks

| ID | Mô tả | Priority | Estimate |
|----|-------|----------|---------|
| AI-FE-001 | ChatPage component (/ai/chat) | HIGH | 1 ngày |
| AI-FE-002 | MessageBubble component (user/assistant) | HIGH | 4h |
| AI-FE-003 | ProductCard inline trong chat | MED | 4h |
| AI-FE-004 | SuggestionChips component | MED | 2h |
| AI-FE-005 | ConversationHistory sidebar | LOW | 4h |
| AI-FE-006 | Typing indicator animation | LOW | 1h |
