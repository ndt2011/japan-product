# Code vs Docs Audit Report

> **Ngày**: 2026-06-09 (lần 8 — V3 + AI-P task còn lại · local) | **Tác giả**: SA  
> **Mục đích**: Kiểm tra code thực tế có phản ánh đúng tài liệu thiết kế không  
> **Trạng thái tổng**: [docs/tasks/STATUS.md](../../tasks/STATUS.md)

---

## Kết luận nhanh

| Câu hỏi | Trả lời |
|---------|---------|
| **Docs có khớp code không?** | **~99% khớp** — Phase 2 **100%** · V3 **100%** · AI-P **100%** |
| **File nào là nguồn sự thật?** | `STATUS.md` + `backend-tasks.md` / `frontend-tasks.md` + code `project/` |
| **Còn lệch gì?** | OPS Railway thủ công · INV-002 pre-order chờ BA · Sprint 7 production |

---

## Kết quả tổng quan

| Mảng | ✅ Khớp | ⚠️ Lệch (chấp nhận) | ❌ Chưa làm |
|------|:-------:|:-------------------:|:-----------:|
| RBAC & Auth | 7 | 0 | 0 |
| Sản phẩm dual pricing | 6 | 0 | 0 |
| Đơn hàng & Delivery | 6 | 1 | 0 |
| Invoice / Hóa đơn | 12 | 0 | 0 |
| Reports / Profit | 3 | 0 | 0 |
| DevOps staging | 5 | 0 | 1 prod |
| **V3 Upgrade** | 38 | 2 | 0 |
| **AI Purchasing** | 9 | 0 | 0 |

---

## ✅ Đã khớp docs ↔ code (verified)

| Hạng mục | Spec | Code | File tham chiếu |
|----------|------|------|-----------------|
| Phase 2 full | BE-P2-001~014 · FE-P2-001~007 | ✅ | `invoice-payment.md` |
| PDF cache RULE-INV-05 | Serve cached `pdf_path` | ✅ | `InvoiceController::pdf` |
| **BE-V3-029** | Form Requests controllers chính | ✅ | `app/Http/Requests/*` |
| POST /profile/avatar | Upload R2/public disk | ✅ | `ProfileService` |
| **BE-AI-007** | Throttle 10 req/user/giờ | ✅ | `AppServiceProvider` + routes |
| **purchasing_sessions** | Lưu phiên analyze | ✅ | migration `100120` |
| GET /ai/purchasing/history | Lịch sử user | ✅ | `AiPurchasingController` |
| GET /ai/purchasing/{id} | Chi tiết phiên | ✅ | `AiPurchasingController` |
| **FE-AI-007** | `/purchasing/history` | ✅ | `PurchasingHistoryScreen.tsx` |
| INV-001 warehouseId | reserve/release + defaultWarehouse | ✅ | `OrderService`, `InventoryService` |
| Tests | 81 passed | ✅ | `php artisan test` |

---

## ⚠️ Lệch thiết kế — Đã ghi nhận, không blocking

| ID | Spec (docs cũ) | Code thực tế | Hành động docs |
|----|----------------|--------------|----------------|
| **DEL-DIFF-01** | `DELIVERED_CLIENT` status riêng | `DELIVERED_ADMIN` → `COMPLETED` | `orders-status.md` ✅ |
| **AI-P-SIMPLE** | Bảng `purchasing_results` riêng | JSON trong `purchasing_sessions.response_json` | Đủ cho history MVP |

---

## ❌ Còn thiếu so với spec đầy đủ (không blocking code task)

| ID | Hạng mục | Priority | Ghi chú |
|----|----------|----------|---------|
| **INV-002** | Pre-order khi hết hàng | P3 | Chờ BA |
| **PROD** | ConoHa VPS production | Sprint 7 | Staging Railway+Vercel OK |
| **OPS** | Railway Shell: `products:generate-vi` + `embed` | P0 ops | AI catalog Luồng B |
| **OPS** | Railway `REDIS_URL` trên service product | P0 ops | Manual |
| **BE-030** | GPT re-rank hybrid search | P2 | Nice-to-have |
| **DEV-28** | Amazon JP PA-API | P1 | Chưa có API key |

---

## Việc tiếp theo

1. OPS Railway: `REDIS_URL` + `products:generate-vi` + `products:embed --force`
2. Deploy migration `100120` staging (auto qua `migrate --force`)
3. Production deploy (ConoHa) — Sprint 7
4. **Chưa push** — hỏi user trước khi commit/deploy
