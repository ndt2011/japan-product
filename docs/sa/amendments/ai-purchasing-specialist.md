# AI Purchasing Specialist — Thiết kế hệ thống

> spec amendment — ngày 2026-06-08  
> liên quan: docs/sa/AI_Search_Implementation.md, docs/sa/amendments/ai-search-improvement.md  
> trạng thái: **Thiết kế — chờ implement**

---

## 1. Tổng quan & Sự khác biệt với AI Search hiện tại

| | AI Search hiện tại | AI Purchasing Specialist (mới) |
|---|---|---|
| **Mục đích** | Tìm sản phẩm trong catalog nội bộ | Tìm + so sánh + tư vấn hàng từ Rakuten/nguồn JP |
| **Input** | Từ khóa tìm kiếm | Yêu cầu mua hàng (có thể là tiếng Việt hoặc Nhật) |
| **Output** | Danh sách sản phẩm khớp | Báo cáo so sánh + đề xuất tối ưu |
| **AI role** | Tìm kiếm semantic | Chuyên gia thu mua (Purchasing Specialist) |
| **So sánh** | Không | Tối thiểu 5 sản phẩm, chấm điểm 5 tiêu chí |
| **Ngôn ngữ** | Tiếng Việt → tìm tiếng Nhật | Song ngữ VI ↔ JP đầy đủ |
| **Nguồn dữ liệu** | MySQL internal catalog | Rakuten Item Search API + catalog nội bộ |

---

## 2. Luồng hoạt động tổng thể

```
Người dùng nhập yêu cầu (VI hoặc JP)
          ↓
[Bước 1] AI phân tích & chuẩn hóa yêu cầu
          ↓
[Bước 2] Song song:
          ├── Rakuten Item Search API (hàng JP)
          └── Internal catalog search (hàng có sẵn trong kho VN)
          ↓
[Bước 3] AI so sánh ≥5 sản phẩm theo 5 tiêu chí
          ↓
[Bước 4] Chấm điểm theo thang trọng số
          ↓
[Bước 5] Sinh báo cáo đề xuất → trả về user
```

---

## 3. System Prompt — AI Role Definition

```
SYSTEM PROMPT (dùng cho GPT-4o / gpt-4o-mini):

Bạn là chuyên gia thu mua (Purchasing Specialist) của công ty nhập khẩu hàng Nhật Bản sang Việt Nam.

Nhiệm vụ của bạn:
1. Phân tích yêu cầu mua hàng từ khách hàng (tiếng Việt hoặc tiếng Nhật).
2. Tìm kiếm và so sánh tối thiểu 5 sản phẩm phù hợp từ thị trường Nhật Bản.
3. Đánh giá từng sản phẩm theo 5 tiêu chí: Giá, Chất lượng, Đánh giá người dùng, Bảo hành, Uy tín thương hiệu.
4. Kiểm tra nguồn gốc xuất xứ (hàng Nhật chính hãng, Made in Japan).
5. Phân tích giá thị trường và biên độ lợi nhuận khi nhập về Việt Nam.
6. Đề xuất sản phẩm tối ưu nhất theo ngân sách và nhu cầu.

Quy tắc bắt buộc:
- Luôn trả lời bằng tiếng Việt (có thể kèm tên tiếng Nhật trong ngoặc).
- Luôn ghi rõ giá JPY (¥) và ước tính giá VND (×170 tỷ giá tham khảo).
- Luôn đề xuất CỤ THỂ 1 sản phẩm tốt nhất + lý do.
- Nếu không tìm được đủ 5 sản phẩm, hãy nói rõ và giải thích.
- Không bịa đặt thông tin sản phẩm — chỉ dùng dữ liệu thực từ API.

Ngữ cảnh hệ thống:
- Khách hàng là nhà nhập sĩ người Việt muốn nhập hàng từ Nhật.
- Sản phẩm phải hợp pháp, có thể nhập khẩu vào Việt Nam.
- Ưu tiên hàng có thể order theo lô (≥10 cái/lần).
```

---

## 4. Workflow chi tiết (5 bước)

### Bước 1 — Xác định yêu cầu

Input từ user có thể là:
- `"Tôi muốn tìm vitamin C Nhật, ngân sách khoảng 500.000đ/hộp"`
- `"日本のビタミンCサプリを探しています"`
- `"Cần tìm máy lọc không khí Nhật cho văn phòng 30m2, dưới 5 triệu"`

AI cần trích xuất:
```json
{
  "product_request": "vitamin C supplement Japan",
  "keywords_vi": ["vitamin C", "thực phẩm chức năng", "nhật bản"],
  "keywords_jp": ["ビタミンC", "サプリメント", "栄養補助食品"],
  "budget_jpy": 3000,
  "budget_vnd": 500000,
  "quantity_min": 10,
  "category_hint": "health_supplement",
  "special_requirements": []
}
```

### Bước 2 — Tìm kiếm đa nguồn

**Nguồn 1: Rakuten Item Search API**
```
GET https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706
  ?applicationId={RAKUTEN_APP_ID}
  &keyword={keywords_jp}
  &hits=30
  &sort=-reviewCount
  &minPrice={budget_jpy * 0.5}
  &maxPrice={budget_jpy * 1.5}
```

**Nguồn 2: Internal catalog**
```php
// ProductEmbeddingService::search($keywords_vi, limit: 10)
// Lấy hàng có sẵn trong kho VN (available_qty > 0)
```

**Kết quả**: Gộp 30 kết quả Rakuten + 10 internal → chọn top 15 đa dạng nhất để đưa vào bước 3.

### Bước 3 — So sánh 5 tiêu chí

Với mỗi sản phẩm, thu thập:

| Tiêu chí | Nguồn dữ liệu | Thang điểm |
|----------|---------------|------------|
| **Giá** | API price field | 1–10 (đảo ngược: rẻ hơn = cao hơn) |
| **Chất lượng** | GPT đánh giá từ spec, thương hiệu, thành phần | 1–10 |
| **Đánh giá người dùng** | `reviewCount`, `reviewAverage` từ Rakuten | 1–10 |
| **Bảo hành** | GPT phân tích từ description | 1–10 |
| **Uy tín thương hiệu** | Danh sách thương hiệu uy tín JP đã biết | 1–10 |

### Bước 4 — Chấm điểm (Weighted Score)

```
Thang trọng số:
  Giá:                30%  (price_score × 0.30)
  Chất lượng:         30%  (quality_score × 0.30)
  Đánh giá người dùng: 20%  (review_score × 0.20)
  Bảo hành:           10%  (warranty_score × 0.10)
  Uy tín thương hiệu:  10%  (brand_score × 0.10)
  ─────────────────────────
  TOTAL SCORE         100%
```

Công thức tính:
```
total_score = (P × 0.30) + (Q × 0.30) + (R × 0.20) + (W × 0.10) + (B × 0.10)
```

Xếp loại:
```
≥8.0 → ⭐⭐⭐ Xuất sắc — Khuyến nghị mạnh
6.0–7.9 → ⭐⭐ Tốt — Đáng cân nhắc
4.0–5.9 → ⭐ Trung bình — Cần xem thêm
<4.0 → Không khuyến nghị
```

### Bước 5 — Báo cáo đề xuất

```
─────────────────────────────────────────────
📊 BÁO CÁO SO SÁNH — [Tên sản phẩm]
Yêu cầu: [yêu cầu gốc từ user]
─────────────────────────────────────────────

TOP 5 SẢN PHẨM:

┌─────────────────────────────────────────────────────────────┐
│ #1 ⭐⭐⭐ Orihiro Vitamin C 60 ngày (オリヒロ ビタミンC)    │
│ Giá: ¥1,980 (~336,600đ) | Score: 8.7/10                    │
│ Đánh giá: 4.5⭐ (2,341 lượt) | Bảo hành: 1 năm            │
│ ✅ KHUYẾN NGHỊ: Giá tốt nhất, review cao, thương hiệu uy tín│
└─────────────────────────────────────────────────────────────┘

┌─ #2 DHC Vitamin C Hard Capsule (DHC ビタミンC) ────────────┐
│ Giá: ¥2,200 (~374,000đ) | Score: 8.1/10                    │
│ Đánh giá: 4.6⭐ (5,120 lượt)                               │
└────────────────────────────────────────────────────────────┘

... (3 sản phẩm tiếp)

─────────────────────────────────────────────
💡 ĐỀ XUẤT TỐI ƯU:
  → Sản phẩm: Orihiro Vitamin C 60 ngày
  → Giá nhập: ¥1,980 (~337,000đ/hộp)
  → Giá bán đề xuất VN: ~500,000đ/hộp
  → Biên lợi nhuận ước tính: ~33%
  → Link Rakuten: https://item.rakuten.co.jp/...
─────────────────────────────────────────────
```

---

## 5. Database Design

### Bảng `purchasing_sessions` — Lưu phiên tìm kiếm
```sql
CREATE TABLE purchasing_sessions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  session_uuid    VARCHAR(36) NOT NULL,  -- UUID phiên làm việc
  request_text    TEXT NOT NULL,          -- Yêu cầu gốc từ user
  request_parsed  JSON,                   -- Kết quả parse bước 1
  status          ENUM('processing','completed','failed') DEFAULT 'processing',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_uuid (session_uuid)
);
```

### Bảng `purchasing_results` — Lưu kết quả so sánh
```sql
CREATE TABLE purchasing_results (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id          BIGINT UNSIGNED NOT NULL,
  rank                TINYINT NOT NULL,              -- Xếp hạng 1-5
  source              ENUM('rakuten','internal','amazon') DEFAULT 'rakuten',
  product_id_internal BIGINT UNSIGNED NULL,          -- NULL nếu từ Rakuten
  rakuten_item_code   VARCHAR(100) NULL,
  product_name        VARCHAR(300) NOT NULL,
  product_name_jp     VARCHAR(300) NULL,
  product_url         TEXT NULL,
  image_url           TEXT NULL,
  price_jpy           INT NULL,
  price_vnd_est       INT NULL,                      -- Ước tính giá VND
  review_average      DECIMAL(3,2) NULL,             -- 0.00–5.00
  review_count        INT NULL DEFAULT 0,
  -- Scores (1-10)
  score_price         DECIMAL(4,2) NULL,
  score_quality       DECIMAL(4,2) NULL,
  score_review        DECIMAL(4,2) NULL,
  score_warranty      DECIMAL(4,2) NULL,
  score_brand         DECIMAL(4,2) NULL,
  total_score         DECIMAL(4,2) NULL,             -- Tổng có trọng số
  is_recommended      TINYINT(1) DEFAULT 0,          -- Sản phẩm được chọn
  gpt_analysis        TEXT NULL,                     -- Phân tích của GPT
  raw_data            JSON NULL,                     -- Raw từ Rakuten API
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES purchasing_sessions(id),
  INDEX idx_session (session_id),
  INDEX idx_score (total_score DESC)
);
```

---

## 6. API Contract

### POST /ai/purchasing
**Auth**: Bearer token (Sanctum)  
**Role**: Tất cả (admin, company, branch)

**Request:**
```json
{
  "request_text": "Tôi muốn tìm vitamin C Nhật, ngân sách 500.000đ/hộp, mua 20 hộp/lần",
  "session_id": null,       // null = tạo phiên mới
  "preferences": {
    "prefer_internal": false,   // Ưu tiên hàng có sẵn trong kho không?
    "min_review_count": 100,    // Chỉ xem sản phẩm có ≥100 đánh giá
    "origin": "japan_only"      // "japan_only" | "any"
  }
}
```

**Response (streaming khuyến nghị, hoặc polling):**
```json
{
  "success": true,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "request_parsed": {
      "keywords_vi": ["vitamin C", "thực phẩm chức năng"],
      "keywords_jp": ["ビタミンC", "サプリメント"],
      "budget_jpy": 2940,
      "budget_vnd": 500000,
      "quantity_min": 20
    },
    "top_products": [
      {
        "rank": 1,
        "product_name": "Orihiro Vitamin C 60 ngày",
        "product_name_jp": "オリヒロ ビタミンC 60日分",
        "source": "rakuten",
        "price_jpy": 1980,
        "price_vnd_est": 336600,
        "review_average": 4.5,
        "review_count": 2341,
        "image_url": "https://thumbnail.image.rakuten.co.jp/...",
        "product_url": "https://item.rakuten.co.jp/...",
        "scores": {
          "price": 8.5,
          "quality": 8.0,
          "review": 9.0,
          "warranty": 7.0,
          "brand": 9.0,
          "total": 8.45
        },
        "is_recommended": true,
        "gpt_analysis": "Orihiro là thương hiệu thực phẩm chức năng Nhật hàng đầu, review rất cao, giá cạnh tranh trong phân khúc. Phù hợp nhập sĩ do có thể đặt số lượng lớn từ Rakuten."
      }
    ],
    "recommendation_summary": "Dựa trên phân tích 5 sản phẩm, Orihiro Vitamin C 60 ngày là lựa chọn tối ưu với tổng điểm 8.45/10. Giá nhập ¥1,980 (~337,000đ), đề xuất bán ~500,000đ (biên ~33%).",
    "profit_analysis": {
      "import_price_jpy": 1980,
      "import_price_vnd": 336600,
      "shipping_estimate_vnd": 50000,
      "tax_estimate_vnd": 33660,
      "total_cost_vnd": 420260,
      "suggested_sell_price_vnd": 500000,
      "estimated_margin_pct": 15.9
    }
  }
}
```

### GET /ai/purchasing/{session_id}
Lấy lại kết quả phiên đã tìm kiếm.

### GET /ai/purchasing/history
Lịch sử tất cả phiên tìm kiếm của user hiện tại.

---

## 7. Implementation Plan

### Phase P1 — Core Engine (BE) — 3 ngày
**Mục tiêu**: API hoạt động, trả kết quả cơ bản

| Task | File | Estimate |
|------|------|----------|
| Migration `purchasing_sessions` + `purchasing_results` | `database/migrations/` | 1h |
| `PurchasingSpecialistService` — parse request + call Rakuten | `app/Services/Ai/PurchasingSpecialistService.php` | 4h |
| `ProductScoringService` — tính điểm 5 tiêu chí | `app/Services/Ai/ProductScoringService.php` | 3h |
| `PurchasingController` — POST + GET endpoints | `app/Http/Controllers/Api/PurchasingController.php` | 2h |
| Routes + middleware | `routes/api.php` | 0.5h |

**Tổng BE P1**: ~10.5h

### Phase P2 — Frontend — 2 ngày
**Mục tiêu**: Màn hình tìm kiếm + hiển thị báo cáo

| Task | File | Estimate |
|------|------|----------|
| `PurchasingScreen.tsx` — form nhập yêu cầu | `components/screens/PurchasingScreen.tsx` | 4h |
| `ProductCompareCard.tsx` — card so sánh 5 sản phẩm | `components/ui/ProductCompareCard.tsx` | 3h |
| `ScoreBar.tsx` — hiển thị thanh điểm 5 tiêu chí | `components/ui/ScoreBar.tsx` | 1h |
| `ProfitCalculator.tsx` — phân tích lợi nhuận | `components/ui/ProfitCalculator.tsx` | 2h |
| Proxy route `/api/proxy/ai/purchasing` | `app/api/proxy/ai/purchasing/route.ts` | 1h |
| Navigation: thêm vào sidebar | `lib/navigation.ts` | 0.5h |

**Tổng FE P2**: ~11.5h

### Phase P3 — Nâng cao — 1 ngày
| Task | Note |
|------|------|
| Streaming response (SSE) | Hiển thị kết quả từng bước thay vì chờ toàn bộ |
| Lưu sản phẩm vào catalog | Nút "Thêm vào danh mục" từ kết quả Rakuten |
| Export PDF báo cáo so sánh | Dùng DomPDF đã có |
| Lịch sử tìm kiếm | Xem lại các phiên trước |

---

## 8. System Prompt đầy đủ (Production-ready)

### Prompt phân tích yêu cầu (Bước 1)

```
Bạn là chuyên gia phân tích yêu cầu mua hàng Nhật Bản.

Nhiệm vụ: Phân tích yêu cầu mua hàng và trả về JSON có cấu trúc.

Trả về JSON với format sau:
{
  "product_request_en": "product name in English for API search",
  "keywords_vi": ["từ khóa VN 1", "từ khóa VN 2"],
  "keywords_jp": ["キーワード1", "キーワード2"],
  "category_hint": "health_supplement | electronics | cosmetics | food | other",
  "budget_jpy": <ngân sách tính bằng JPY, null nếu không có>,
  "budget_vnd": <ngân sách VND, null nếu không có>,
  "quantity_min": <số lượng tối thiểu mỗi lần nhập, mặc định 10>,
  "special_requirements": ["yêu cầu đặc biệt nếu có"]
}

Quy tắc:
- Nếu ngân sách bằng VND, chuyển sang JPY (chia 170).
- Nếu không có ngân sách, budget_jpy = null.
- keywords_jp phải là Hiragana/Katakana/Kanji thực sự (không phải Romaji).
- Không thêm thông tin không có trong yêu cầu.
```

### Prompt chấm điểm (Bước 4)

```
Bạn là chuyên gia đánh giá sản phẩm Nhật Bản với kinh nghiệm 10 năm nhập khẩu.

Cho danh sách sản phẩm sau đây, hãy chấm điểm từng sản phẩm theo 5 tiêu chí, mỗi tiêu chí từ 1-10:

Tiêu chí và trọng số:
1. Giá (30%): 10 = rẻ nhất trong nhóm, 1 = đắt nhất
2. Chất lượng (30%): Đánh giá dựa trên thành phần, thương hiệu, xuất xứ
3. Đánh giá người dùng (20%): Dựa trên reviewAverage (0-5) và reviewCount
4. Bảo hành (10%): Phân tích từ mô tả sản phẩm
5. Uy tín thương hiệu (10%): Dựa trên tên thương hiệu JP

Thương hiệu uy tín đã biết (điểm 9-10):
DHC, Orihiro, Fancl, Suntory, Meiji, Asahi, Rohto, Shiseido, Kao, Lion, Panasonic, Sony, Sharp, Omron

Trả về JSON array, mỗi phần tử là:
{
  "index": <index trong danh sách input>,
  "score_price": <1-10>,
  "score_quality": <1-10>,
  "score_review": <1-10>,
  "score_warranty": <1-10>,
  "score_brand": <1-10>,
  "analysis_vi": "<phân tích ngắn 1-2 câu bằng tiếng Việt>"
}
```

### Prompt sinh báo cáo (Bước 5)

```
Bạn là chuyên gia thu mua hàng Nhật Bản. Hãy sinh báo cáo so sánh và đề xuất sản phẩm.

Yêu cầu từ khách hàng: {request_text}

Kết quả so sánh (đã có điểm số):
{products_with_scores}

Hãy viết báo cáo bằng tiếng Việt bao gồm:
1. Tóm tắt top 5 sản phẩm (tên, giá, điểm)
2. Ưu nhược điểm của từng sản phẩm
3. Đề xuất rõ ràng: sản phẩm nào tốt nhất và tại sao
4. Phân tích biên lợi nhuận ước tính khi nhập về VN
5. Lưu ý đặc biệt nếu có (ví dụ: hàng mùa, hết hàng sắp xảy ra, v.v.)

Giọng văn: chuyên nghiệp, ngắn gọn, thực tiễn cho nhà nhập sĩ.
```

---

## 9. Xử lý ngôn ngữ VI ↔ JP

### Vấn đề cốt lõi

```
User: "Tôi muốn tìm máy lọc không khí Nhật cho phòng 30m2"
  ↓
Rakuten API cần: "空気清浄機 30畳" (tiếng Nhật)
  ↓
Kết quả Rakuten trả về: Tên sản phẩm + mô tả tiếng Nhật
  ↓
Báo cáo phải hiển thị: Tiếng Việt (có kèm tên JP)
```

### Giải pháp

**Bước 1** — GPT dịch yêu cầu VI → keywords JP cho API  
**Bước 2** — Rakuten API nhận keywords JP → trả kết quả JP  
**Bước 3** — GPT dịch mô tả JP → VI để hiển thị trong báo cáo  
**Caching** — Cache translation 24h (Redis hoặc DB) tránh gọi API lặp lại

### Bảng ánh xạ danh mục VI → JP (hardcode + AI fallback)

```php
const CATEGORY_MAP_VI_JP = [
    'vitamin'              => 'ビタミン サプリ',
    'thực phẩm chức năng'  => 'サプリメント 健康食品',
    'mỹ phẩm'              => 'コスメ スキンケア',
    'máy lọc không khí'    => '空気清浄機',
    'máy lọc nước'         => '浄水器',
    'nồi cơm điện'         => '炊飯器',
    'máy massage'          => 'マッサージ機',
    'tã giấy'              => 'おむつ',
    'sữa bột'              => '粉ミルク',
    'thực phẩm'            => '食品 食料品',
    'đồ gia dụng'          => '家電 生活家電',
    'thuốc'                => 'medical',  // Không search Rakuten → dùng catalog nội bộ
];
```

---

## 10. Ví dụ đầu vào & đầu ra (Teaching by Example)

### Ví dụ 1 — Tiếng Việt đơn giản

**Input:**
```
"Cần tìm vitamin C Nhật, uống hàng ngày, giá dưới 500k/hộp"
```

**Parsed (Bước 1):**
```json
{
  "keywords_jp": ["ビタミンC", "サプリメント", "毎日"],
  "budget_jpy": 2940,
  "category_hint": "health_supplement"
}
```

**Top 5 kết quả (Bước 3–4):**

| # | Sản phẩm | Giá JP | Score |
|---|----------|--------|-------|
| 1 | Orihiro ビタミンC 60日 | ¥1,980 | 8.45 ⭐⭐⭐ |
| 2 | DHC ビタミンC ハードカプセル | ¥2,200 | 8.10 ⭐⭐ |
| 3 | Fancl ビタミンC | ¥2,500 | 7.80 ⭐⭐ |
| 4 | Now Foods C-1000 (nhập JP) | ¥3,200 | 6.50 ⭐⭐ |
| 5 | Kobayashi ビタミンC | ¥1,500 | 6.20 ⭐ |

**Đề xuất (Bước 5):**
```
✅ KHUYẾN NGHỊ: Orihiro Vitamin C 60 ngày
- Giá nhập: ¥1,980 (~336,600đ)
- Tổng chi phí (nhập + thuế + ship ước tính): ~420,000đ
- Đề xuất bán: 499,000đ
- Biên lợi nhuận: ~15.9%
- Lý do: Thương hiệu uy tín, review 4.5⭐ (2,341 lượt), giá tốt nhất trong nhóm
```

### Ví dụ 2 — Tiếng Nhật

**Input:**
```
"日本の空気清浄機を探しています。20畳くらいの部屋に使いたいです。予算は3万円以下"
```

**Parsed:**
```json
{
  "keywords_jp": ["空気清浄機", "20畳"],
  "budget_jpy": 30000,
  "category_hint": "electronics"
}
```

**Output (tiếng Việt + tên JP):**
```
📊 BÁO CÁO: Máy lọc không khí Nhật 20 畳

#1 ⭐⭐⭐ Panasonic F-PXT55 (パナソニック 空気清浄機)
   Giá: ¥28,000 (~4,760,000đ) | Score: 8.9/10
   → Phù hợp 23畳, lọc PM2.5, review 4.6⭐
   ✅ KHUYẾN NGHỊ TỐT NHẤT
...
```

---

## 11. Checklist Dev

### Backend
- [ ] Migration: `purchasing_sessions` + `purchasing_results`
- [ ] `PurchasingSpecialistService::parseRequest()` — GPT parse VI/JP → JSON
- [ ] `PurchasingSpecialistService::searchProducts()` — gọi Rakuten API + internal
- [ ] `ProductScoringService::scoreAll()` — GPT chấm điểm 5 tiêu chí
- [ ] `PurchasingSpecialistService::generateReport()` — GPT sinh báo cáo VI
- [ ] `PurchasingController` — POST `/ai/purchasing`
- [ ] Rate limiting: max 10 request/user/giờ (tránh spam OpenAI)
- [ ] Cache: translation 24h, Rakuten results 1h

### Frontend
- [ ] `PurchasingScreen.tsx` — form + kết quả
- [ ] `ProductCompareCard.tsx` — card so sánh có score bars
- [ ] `ScoreBar.tsx` — visualize 5 tiêu chí
- [ ] `ProfitCalculator.tsx` — ước tính lợi nhuận
- [ ] Proxy route
- [ ] Navigation: thêm "Tư vấn thu mua" vào sidebar

### QA
- [ ] Test: input tiếng Việt → keywords JP đúng
- [ ] Test: input tiếng Nhật → báo cáo tiếng Việt đúng
- [ ] Test: ngân sách VND → chuyển đúng sang JPY
- [ ] Test: Rakuten trả 0 kết quả → fallback về internal catalog
- [ ] Test: điểm số tổng hợp đúng công thức

---

## 12. Phụ lục — Thương hiệu JP đáng tin cậy

```php
// Dùng để tính score_brand tự động
const TRUSTED_BRANDS_JP = [
    // Thực phẩm chức năng
    'DHC' => 9, 'オリヒロ' => 9, 'Orihiro' => 9,
    'ファンケル' => 9, 'Fancl' => 9, 'サントリー' => 9,
    '明治' => 9, 'アサヒ' => 8, '大正製薬' => 9,
    'ロート' => 8, 'Rohto' => 8, '小林製薬' => 8,

    // Điện tử gia dụng
    'パナソニック' => 10, 'Panasonic' => 10,
    'シャープ' => 9, 'Sharp' => 9, 'ダイキン' => 10,
    '日立' => 9, 'Hitachi' => 9, '東芝' => 9, 'Toshiba' => 9,
    'ソニー' => 10, 'Sony' => 10, 'アイリスオーヤマ' => 8,

    // Mỹ phẩm
    '資生堂' => 10, 'Shiseido' => 10, '花王' => 9, 'Kao' => 9,
    '高丝' => 8, 'コーセー' => 8, 'SK-II' => 9,
    'ライオン' => 8, 'Lion' => 8,
];
```
