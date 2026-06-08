# Milestones

**Dự án**: Hệ thống quản lý hàng hóa Nhật-Việt  
**Phiên bản**: 1.1 | **Ngày**: 2026-06-08

> Chi tiết: [docs/tasks/STATUS.md](../tasks/STATUS.md)

---

| Milestone | Ngày mục tiêu | Tiêu chí nghiệm thu | Trạng thái |
|-----------|---------------|---------------------|------------|
| **M1**: Khởi động dự án | 2026-06-14 | Tài liệu đầy đủ, repo GitHub, dev local OK | ✅ Hoàn thành |
| **M2**: Auth + RBAC live | 2026-06-28 | Login 4 role, user mgmt, staging deploy | ✅ Staging live |
| **M3**: Product + AI live | 2026-07-26 | CRUD SP + ảnh R2, AI Rakuten + hybrid catalog | ✅ ~95% |
| **M4**: Order flow complete | 2026-08-09 | Đặt hàng, confirm, tỷ giá lock, invoice auto | 🔄 ~90% |
| **M5**: Shipment tracking live | 2026-08-23 | Batch, DELIVERED_ADMIN, confirm-receipt | ✅ ~95% |
| **M6**: Phase 2 Invoice | 2026-09-01 | HĐ, công nợ, profit, dual pricing form | ✅ ~98% staging |
| **M7**: UAT hoàn thành | 2026-09-13 | 0 critical bugs, test pass | ⬜ |
| **M8**: Production Go-Live | 2026-09-20 | ConoHa VPS hoặc Railway prod | ⬜ |
| **M9**: Phase 2 extended | 2026-10-01 | DomPDF, profit FE, dual pricing form | ⬜ |

---

## Điều kiện rủi ro làm trễ milestone

- AI scraping bị block: +1 sprint — đã whitelist IP Rakuten trên staging ✅
- Team thiếu người: Defer REQ-003 full RBAC sang Phase 3
- VPS ConoHa: Dùng Railway staging làm demo (hiện tại) ✅
