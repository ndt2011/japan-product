# AI Staff Chat Widget

> spec amendment — ngày 2026-06-08
> liên quan: docs/sa/amendments/ai-conversation-upgrade.md

---

## 1. Mục đích

Cung cấp giao diện chat nổi (floating) cho **tất cả người dùng** (admin, công ty, chi nhánh) để hỏi AI nhân viên về dữ liệu hệ thống bằng ngôn ngữ tự nhiên — mà không cần rời khỏi trang hiện tại.

Đây là **khác hoàn toàn** với `AICenterScreen` (tìm kiếm sản phẩm Rakuten/Amazon). Chat widget này hỏi về **dữ liệu nội bộ**: đơn hàng, tồn kho, hóa đơn, chính sách.

---

## 2. Vị trí & Layout

```
┌────────────────────────────────────────────┐
│  Sidebar  │  Header                         │
│           │─────────────────────────────────│
│           │  <nội dung trang>               │
│           │                                 │
│           │              [💬] ← floating    │
└────────────────────────────────────────────┘
```

- **Floating button**: góc phải dưới, `fixed bottom-6 right-6 z-50`
- **Panel**: slide-up từ button, `w-380px`, `max-h-[calc(100vh-6rem)]`
- **Vị trí trong code**: `AppShell.tsx` (render sau `<main>`)

---

## 3. Phân quyền dữ liệu

| Role | Dữ liệu AI có thể trả về |
|------|--------------------------|
| `admin` | Tất cả đơn hàng, tất cả công ty, cost_price, tồn kho toàn bộ, báo cáo |
| `company` | Chỉ đơn hàng của công ty mình, hóa đơn của mình, giá bán (không có cost_price) |
| `branch_manager` / `branch_staff` | Chỉ đơn hàng của chi nhánh mình, không thấy giá gốc |

Phân quyền được xử lý **hoàn toàn ở backend** (`AiChatService`) — frontend chỉ gửi token, không cần truyền role.

---

## 4. Suggested Prompts theo role

**Admin:**
- "Tổng đơn hàng đang xử lý?"
- "Công nợ chưa thanh toán?"
- "Sản phẩm sắp hết hàng?"
- "Chuyến hàng đang vận chuyển?"

**CompanyVn:**
- "Đơn hàng của tôi đang ở đâu?"
- "Hóa đơn tháng này bao nhiêu?"
- "Sản phẩm nào còn hàng?"
- "Quy trình đặt hàng như thế nào?"

**Branch:**
- "Đơn chi nhánh tôi đang xử lý?"
- "Có đơn nào chờ xác nhận không?"
- "Hàng nào còn tồn kho?"
- "Làm sao để đặt thêm hàng?"

---

## 5. API Contract

### POST /ai/chat
```json
// Request
{
  "message": "Đơn ORD-202606-0001 đang ở đâu?",
  "conversation_id": null   // null = tạo conversation mới
}

// Response
{
  "success": true,
  "data": {
    "conversation_id": 12,
    "message_id": 47,
    "reply": "Đơn ORD-202606-0001 đang ở trạng thái PROCESSING — đã được gộp vào chuyến hàng #5 ngày 2026-06-07.",
    "intent": "ORDER_STATUS",
    "suggestions": ["Xem chi tiết chuyến hàng?", "Khi nào về đến kho?"]
  }
}
```

---

## 6. Files liên quan

| File | Vai trò |
|------|---------|
| `components/layout/AiStaffChatWidget.tsx` | UI widget (floating button + panel) |
| `components/layout/AppShell.tsx` | Mount widget vào layout |
| `app/api/proxy/ai/chat/route.ts` | Next.js proxy route |
| `app/api/proxy/ai/conversations/route.ts` | Danh sách conversations |
| `app/api/proxy/ai/conversations/[id]/messages/route.ts` | Lịch sử tin nhắn |
| `app/Services/Ai/AiChatService.php` | Backend xử lý intent + GPT-4o |
| `app/Http/Controllers/API/AiChatController.php` | Backend controller |

---

## 7. UX Features

- **Unread badge**: nếu AI trả lời khi panel đóng → hiện số đỏ trên button
- **New conversation**: nút ✏️ trong header → reset về cuộc trò chuyện mới
- **Intent badge**: mỗi tin nhắn AI hiển thị intent nhỏ (📦 Đơn hàng, 🧾 Hóa đơn...)
- **Typing indicator**: 3 chấm nhảy khi AI đang xử lý
- **Keyboard**: Enter gửi, Shift+Enter xuống dòng
- **Persist conversation**: `conversation_id` giữ nguyên trong session, AI nhớ context 10 tin trước

---

## 8. Deploy checklist

- [ ] Migration `ai_conversations` + `ai_messages` đã chạy trên Railway
- [ ] `OPENAI_API_KEY` đã set trong Railway Secret Variables
- [ ] `RAKUTEN_APP_ID` đã set (cho intent RAKUTEN_DISCOVER)
- [ ] Test với 3 role: admin / company / branch
