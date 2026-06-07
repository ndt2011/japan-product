# QA Tasks

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Cập nhật**: 2026-06-07 | **Assignee**: QA Engineer  
**Trạng thái tổng**: Xem [STATUS.md](./STATUS.md)

**Legend**: ✅ Done | 🔄 Partial | ⏸ Blocked | 📋 Todo

---

## SPRINT 1 — Auth

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-001 | Test Auth: login, Remember Me, logout, lockout | P0 | 1d | 🔄 PHPUnit 7 case ✅ · Postman 📋 |
| QA-001a | TC-AUTH-004/005 Remember Me TTL | P0 | 2h | 📋 DEV-05 |
| QA-001b | TC-AUTH-007 logout revoke | P0 | 1h | 📋 DEV-05 |
| QA-001c | TC-AUTH-006 lockout 5 lần | P0 | 2h | ⏸ REQ-007 + BE-006 |
| QA-002 | RBAC: mỗi role → 403 khi không có quyền | P0 | 1d | ⏸ REQ-003 |

**Có thể chạy ngay**: TC-AUTH-001 (login OK), TC-AUTH-002 (sai MK → M0101), TC-AUTH-004/005 (remember_me), TC-AUTH-007 (logout).

---

## SPRINT 2 — Sản phẩm

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-003 | CRUD sản phẩm + soft delete | P0 | 1d | 🔄 Create API test ✅ · ảnh 📋 |
| QA-004 | VN Branch chỉ xem ACTIVE | P0 | 0.5d | ⏸ REQ-003 |

---

## SPRINT 3 — AI Search

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-005 | AI search happy/empty/timeout | P0 | 1d | 📋 |
| QA-006 | Duyệt/từ chối candidate | P0 | 0.5d | 📋 |

---

## SPRINT 4 — Đơn hàng

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-007 | Tạo đơn, vượt tồn, nháp, tạm giữ | P0 | 1.5d | 📋 |
| QA-008 | Lock tỷ giá khi confirm | P0 | 1d | 📋 |
| QA-009 | Email đơn mới / confirm | P0 | 0.5d | 📋 |

---

## SPRINT 5 — Chuyến hàng

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-010 | Tạo batch, gom đơn CONFIRMED | P0 | 1d | 📋 |
| QA-011 | Status chuyến đúng thứ tự | P0 | 0.5d | 📋 |

---

## SPRINT 6 — E2E & Performance

| ID | Mô tả | P | Est | Trạng thái |
|----|-------|---|-----|------------|
| QA-012 | E2E full flow (Playwright) | P0 | 2d | 📋 |
| QA-013 | Performance < 500ms / 10 users | P1 | 1d | 📋 |
| QA-014 | Security: SQLi, XSS, IDOR, JWT | P0 | 1d | 📋 |

---

## Môi trường test

| Môi trường | URL | Trạng thái |
|------------|-----|------------|
| Local API | `http://localhost:8000/api` | ✅ |
| Local FE | `http://localhost:3000` | ✅ |
| Railway staging | TBD | 📋 DEV-12 |
| Vercel preview | TBD | 📋 DEV-13 |

**Tài kệ**: `docs/qa/test-cases.md`, `docs/qa/acceptance-criteria.md`

---

## Bug Report Format

```
Title: [Module][Severity] Mô tả ngắn
Severity: Critical / High / Medium / Low
Steps to reproduce:
  1. ...
Expected: ...
Actual: ...
Environment: Railway Staging / Local
Screenshot/Video: [đính kèm]
```
