# Amendment — AI Product Search: Cải thiện tìm kiếm tiếng Việt

> **Ngày**: 2026-06-07 | **Liên quan**: `AI_Search_Implementation.md` (Luồng B)  
> **Vấn đề**: User tìm bằng tiếng Việt nhưng dữ liệu sản phẩm chủ yếu tiếng Nhật/Anh  
> **Mục tiêu**: Tìm "vitamin c nhật bản" → tìm đúng sản phẩm dù tên SP là "ビタミンC Orihiro"

---

## Tại sao hiện tại kém với tiếng Việt?

```
User: "thuốc bổ gan nhật bản"
                ↓
     OpenAI tạo vector cho câu này
                ↓
     So sánh với vector của sản phẩm
     (sản phẩm embed: "肝臓サポート | Liver Support | Orihiro")
                ↓
     Cosine similarity thấp → kết quả sai/thiếu
```

**Nguyên nhân gốc**: Vector của "thuốc bổ gan" và "肝臓サポート" khác nhau vì **embedding text của sản phẩm không có tiếng Việt**.

---

## Lộ trình cải thiện (4 Phase)

| Phase | Thời gian | Tác động | Khó |
|-------|-----------|----------|-----|
| 1 — Thêm mô tả tiếng Việt vào SP | 1–2 ngày | ⭐⭐⭐ Cao | Thấp |
| 2 — GPT mở rộng câu query | 1 ngày | ⭐⭐⭐ Cao | Thấp |
| 3 — Hybrid search (semantic + keyword) | 3–5 ngày | ⭐⭐ Trung | Trung |
| 4 — GPT re-ranking kết quả | 2–3 ngày | ⭐⭐ Trung | Trung |

**Khuyến nghị**: Làm Phase 1 + 2 trước → cải thiện ngay ~70%, sau đó Phase 3 nếu cần.

---

## Phase 1 — Thêm trường tiếng Việt vào sản phẩm

### Vấn đề

`ProductEmbeddingService::buildProductText()` hiện tạo text từ:
```
product_name | product_name_jp | spec | description | origin | category | supplier
```
Không có tiếng Việt → embedding không match query VN.

### Giải pháp

Thêm cột `name_vi` + `description_vi` vào bảng `products`, embed cả 3 ngôn ngữ cùng nhau.

#### Migration

**File**: `2026_06_07_210000_add_vietnamese_fields_to_products.php`

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('name_vi', 300)->nullable()->after('product_name_jp')
                  ->comment('Tên tiếng Việt để tìm kiếm AI');
            $table->text('description_vi')->nullable()->after('description')
                  ->comment('Mô tả tiếng Việt để tìm kiếm AI');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['name_vi', 'description_vi']);
        });
    }
};
```

#### Cập nhật ProductEmbeddingService

```php
// app/Services/ProductEmbeddingService.php

public function buildProductText(Product $product): string
{
    $parts = array_filter([
        // Tiếng Nhật (gốc)
        $product->product_name_jp,

        // Tiếng Anh / phiên âm
        $product->product_name,
        $product->product_cd,

        // Tiếng Việt (MỚI) ← quan trọng nhất cho user VN
        $product->name_vi,
        $product->description_vi,

        // Thông tin chung
        $product->spec,
        $product->description,
        $product->origin,
        optional($product->category)->category_name,
        optional($product->supplier)->supplier_name,
    ]);

    return implode(' | ', $parts);
}
```

#### Thêm name_vi vào API response (ProductController)

```php
// Thêm vào $fillable của Product model
protected $fillable = [
    // ... fields hiện có ...
    'name_vi',
    'description_vi',
];

// Thêm validation khi tạo/sửa sản phẩm
'name_vi'        => 'nullable|string|max:300',
'description_vi' => 'nullable|string|max:2000',
```

#### Hướng dẫn nhập liệu

Có 2 cách nhập `name_vi`:
1. **Thủ công**: Admin nhập khi tạo/sửa sản phẩm (trường "Tên tiếng Việt")
2. **GPT auto-generate** (xem Phase 2b bên dưới)

Sau khi nhập xong → re-embed:
```bash
php artisan products:embed --force
```

---

## Phase 2 — GPT mở rộng câu query (Query Expansion)

### Vấn đề

User gõ: `"gan"` → quá ngắn, embedding yếu  
User gõ: `"bổ thận mạnh gân cốt"` → không khớp tên SP nào

### Giải pháp: Dùng GPT để mở rộng query trước khi embed

```
User: "thuốc bổ gan nhật"
              ↓
     GPT mở rộng thành:
     {
       "expanded": "thuốc bổ gan nhật bản, liver supplement japan, 肝臓 サプリ, ornithine, silymarin",
       "category_hint": "Thực phẩm chức năng",
       "keywords_vi": ["bổ gan", "gan nhiễm mỡ", "detox gan"]
     }
              ↓
     Embed câu expanded → cosine similarity cao hơn nhiều
```

#### QueryExpansionService

**File**: `app/Services/QueryExpansionService.php`

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use OpenAI\Laravel\Facades\OpenAI;

class QueryExpansionService
{
    /**
     * Mở rộng query tiếng Việt → đa ngôn ngữ
     * Cache 1 giờ để tiết kiệm API call
     */
    public function expand(string $query): string
    {
        if (empty(config('openai.api_key'))) {
            return $query; // fallback: dùng query gốc
        }

        $cacheKey = 'query_expansion_' . md5($query);

        return Cache::remember($cacheKey, 3600, function () use ($query) {
            try {
                $response = OpenAI::chat()->create([
                    'model'       => config('openai.model', 'gpt-4o-mini'),
                    'temperature' => 0.3,
                    'max_tokens'  => 200,
                    'messages'    => [
                        [
                            'role'    => 'system',
                            'content' => <<<PROMPT
Bạn là chuyên gia về sản phẩm Nhật Bản nhập khẩu vào Việt Nam.
Khi nhận được từ khóa tìm kiếm tiếng Việt, hãy mở rộng thành chuỗi từ khóa đa ngôn ngữ (tiếng Việt + tiếng Anh + tiếng Nhật) để tìm kiếm sản phẩm tốt hơn.
Chỉ trả về chuỗi từ khóa, KHÔNG giải thích, KHÔNG JSON, KHÔNG markdown.
Các từ khóa cách nhau bằng dấu phẩy. Tối đa 30 từ.
PROMPT,
                        ],
                        [
                            'role'    => 'user',
                            'content' => "Mở rộng từ khóa: \"{$query}\"",
                        ],
                    ],
                ]);

                $expanded = trim($response->choices[0]->message->content ?? '');
                return $expanded ?: $query;

            } catch (\Throwable $e) {
                \Log::warning("Query expansion failed: {$e->getMessage()}");
                return $query;
            }
        });
    }
}
```

**Ví dụ output**:
```
Input:  "thuốc bổ gan nhật"
Output: "thuốc bổ gan nhật bản, liver supplement Japan, 肝臓サプリ, 
         silymarin, ornithine, UDCA, liver detox, gan nhiễm mỡ, 
         bảo vệ gan, orihiro liver"
```

#### Tích hợp vào ProductEmbeddingService::search()

```php
// app/Services/ProductEmbeddingService.php

public function __construct(
    private QueryExpansionService $queryExpansion
) {
    $this->limit = (int) env('AI_SEARCH_LIMIT', 15);
}

public function search(string $query, int $limit = null): array
{
    $limit = $limit ?? $this->limit;

    // MỚI: Mở rộng query trước khi embed
    $expandedQuery = $this->queryExpansion->expand($query);

    // Embed câu đã mở rộng
    $queryVector = $this->getEmbedding($expandedQuery);

    // ... phần còn lại giữ nguyên
}
```

#### 2b — GPT tự sinh name_vi cho sản phẩm (Artisan command)

**File**: `app/Console/Commands/GenerateVietnameseNames.php`

```php
<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use OpenAI\Laravel\Facades\OpenAI;

class GenerateVietnameseNames extends Command
{
    protected $signature   = 'products:generate-vi {--id= : Chỉ 1 sản phẩm}';
    protected $description = 'Tự động sinh tên + mô tả tiếng Việt bằng GPT';

    public function handle(): int
    {
        $query = Product::query()
            ->where('disabled_flag', 0)
            ->whereNull('name_vi'); // chỉ những SP chưa có tên VN

        if ($id = $this->option('id')) {
            $query->where('id', $id);
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->info('Không có sản phẩm nào cần dịch.');
            return 0;
        }

        $this->info("Dịch {$products->count()} sản phẩm...");
        $bar = $this->output->createProgressBar($products->count());
        $bar->start();

        foreach ($products as $product) {
            try {
                $result = $this->translateProduct($product);
                $product->update([
                    'name_vi'        => $result['name_vi'],
                    'description_vi' => $result['description_vi'],
                ]);
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("Lỗi #{$product->id}: {$e->getMessage()}");
            }

            $bar->advance();
            usleep(500_000); // 0.5s tránh rate limit
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('✅ Xong. Chạy products:embed --force để re-embed.');

        return 0;
    }

    private function translateProduct(Product $product): array
    {
        $info = implode("\n", array_filter([
            "Tên JP: {$product->product_name_jp}",
            "Tên EN: {$product->product_name}",
            "Mã: {$product->product_cd}",
            "Spec: {$product->spec}",
            "Mô tả: {$product->description}",
            "Xuất xứ: {$product->origin}",
        ]));

        $response = OpenAI::chat()->create([
            'model'       => 'gpt-4o-mini',
            'temperature' => 0.3,
            'max_tokens'  => 300,
            'messages'    => [
                [
                    'role'    => 'system',
                    'content' => 'Bạn là chuyên gia dịch thuật sản phẩm Nhật Bản sang tiếng Việt. Trả về JSON với 2 key: name_vi (tên tiếng Việt ngắn gọn, max 100 ký tự) và description_vi (mô tả công dụng tiếng Việt, max 300 ký tự). Dùng từ ngữ phổ thông người Việt hay tìm kiếm.',
                ],
                [
                    'role'    => 'user',
                    'content' => "Dịch sản phẩm này:\n{$info}",
                ],
            ],
            'response_format' => ['type' => 'json_object'],
        ]);

        $data = json_decode($response->choices[0]->message->content, true);

        return [
            'name_vi'        => $data['name_vi'] ?? null,
            'description_vi' => $data['description_vi'] ?? null,
        ];
    }
}
```

**Chạy**:
```bash
# Sinh tên VN cho tất cả SP chưa có
php artisan products:generate-vi

# Xem kết quả
php artisan tinker
>>> App\Models\Product::whereNotNull('name_vi')->first(['product_name', 'name_vi', 'description_vi'])

# Re-embed sau khi có name_vi
php artisan products:embed --force
```

---

## Phase 3 — Hybrid Search (Semantic + Keyword)

**Khi nào cần**: Nếu Phase 1+2 vẫn miss kết quả với mã sản phẩm (`P003`), tên chính xác.

### Cơ chế

```
Score cuối = 0.7 × semantic_score + 0.3 × keyword_score
```

#### MySQL FULLTEXT Index

**Migration**:
```php
Schema::table('products', function (Blueprint $table) {
    $table->fullText(['product_name', 'product_name_jp', 'name_vi', 'description_vi', 'spec', 'product_cd'],
                     'products_fulltext');
});
```

#### Hybrid search trong ProductEmbeddingService

```php
public function search(string $query, int $limit = null): array
{
    $limit = $limit ?? $this->limit;

    // 1. Mở rộng query
    $expandedQuery = $this->queryExpansion->expand($query);

    // 2. Semantic search (lấy rộng hơn để re-rank)
    $semanticResults = $this->semanticSearch($expandedQuery, $limit * 2);

    // 3. Keyword search
    $keywordResults = $this->keywordSearch($query, $limit * 2);

    // 4. Kết hợp score
    $combined = $this->mergeResults($semanticResults, $keywordResults, $limit);

    return $combined;
}

private function keywordSearch(string $query, int $limit): Collection
{
    // Thoát ký tự đặc biệt MySQL FULLTEXT
    $safeQuery = $this->escapeFulltext($query);

    return Product::query()
        ->whereRaw("MATCH(product_name, product_name_jp, name_vi, description_vi, spec, product_cd) AGAINST(? IN BOOLEAN MODE)", [$safeQuery . '*'])
        ->where('disabled_flag', 0)
        ->whereNull('deleted_flag')
        ->selectRaw("*, MATCH(product_name, product_name_jp, name_vi, description_vi, spec, product_cd) AGAINST(? IN BOOLEAN MODE) as keyword_score", [$safeQuery . '*'])
        ->limit($limit)
        ->get();
}

private function mergeResults(array $semantic, Collection $keyword, int $limit): array
{
    // Normalize keyword scores về [0, 1]
    $maxKeyword = $keyword->max('keyword_score') ?: 1;

    // Build map: product_id → scores
    $scores = [];

    foreach ($semantic as $item) {
        $pid = $item['product']->id;
        $scores[$pid] = [
            'product'        => $item['product'],
            'semantic_score' => $item['similarity'],
            'keyword_score'  => 0,
        ];
    }

    foreach ($keyword as $product) {
        $pid = $product->id;
        $kScore = $product->keyword_score / $maxKeyword;
        if (isset($scores[$pid])) {
            $scores[$pid]['keyword_score'] = $kScore;
        } else {
            $scores[$pid] = [
                'product'        => $product,
                'semantic_score' => 0,
                'keyword_score'  => $kScore,
            ];
        }
    }

    // Tính final score
    return collect($scores)
        ->map(function ($item) {
            $item['final_score'] = 0.7 * $item['semantic_score'] + 0.3 * $item['keyword_score'];
            return $item;
        })
        ->sortByDesc('final_score')
        ->take($limit)
        ->values()
        ->map(fn($item) => $this->formatProduct($item['product'], $item['final_score']))
        ->all();
}

private function escapeFulltext(string $query): string
{
    // Bỏ ký tự đặc biệt MySQL FULLTEXT
    return preg_replace('/[+\-><\(\)~*\"@]+/', ' ', $query);
}
```

---

## Phase 4 — GPT Re-ranking (tùy chọn, tốn API)

**Khi nào cần**: Khi kết quả đúng sản phẩm nhưng sắp xếp chưa tốt.

```php
// Sau khi có top 30 kết quả từ hybrid search → hỏi GPT sắp xếp lại top 10

private function rerankWithGPT(array $results, string $query, int $topN = 10): array
{
    $productList = collect($results)->take(30)->map(fn($p, $i) => [
        'index'        => $i,
        'name_vi'      => $p['name_vi'] ?? $p['product_name'],
        'product_name' => $p['product_name'],
        'spec'         => $p['spec'] ?? '',
    ])->values()->toArray();

    $response = OpenAI::chat()->create([
        'model'       => 'gpt-4o-mini',
        'temperature' => 0,
        'max_tokens'  => 100,
        'messages'    => [
            [
                'role'    => 'system',
                'content' => 'Bạn nhận danh sách sản phẩm và câu tìm kiếm. Trả về mảng JSON các index của sản phẩm liên quan nhất, theo thứ tự từ liên quan nhất đến ít nhất. Chỉ trả JSON array, không giải thích.',
            ],
            [
                'role'    => 'user',
                'content' => "Câu tìm: \"{$query}\"\n\nDanh sách: " . json_encode($productList, JSON_UNESCAPED_UNICODE),
            ],
        ],
        'response_format' => ['type' => 'json_object'],
    ]);

    $ranked = json_decode($response->choices[0]->message->content ?? '[]', true);
    $indices = is_array($ranked) ? array_slice(array_values($ranked), 0, $topN) : [];

    return collect($indices)
        ->filter(fn($i) => isset($results[$i]))
        ->map(fn($i) => $results[$i])
        ->values()
        ->all();
}
```

> **Chi phí Phase 4**: ~$0.0002/lần search. Nếu 1000 search/ngày → $6/tháng. Chỉ bật khi cần.

---

## Tóm tắt: Thứ tự implement

### Bước 1 (làm ngay, không risk)
```bash
# 1. Migrate thêm name_vi, description_vi
php artisan migrate

# 2. Sinh tên VN tự động bằng GPT
php artisan products:generate-vi

# 3. Re-embed tất cả
php artisan products:embed --force

# 4. Test
curl -X POST .../api/ai/product-search \
  -H "Authorization: Bearer {token}" \
  -d '{"query": "vitamin c nhật bản"}'
```

### Bước 2 (sau khi có tên VN)
- Thêm `QueryExpansionService` 
- Inject vào `ProductEmbeddingService`
- Test với các query tiếng Việt khó

### Bước 3 (nếu vẫn cần)
- FULLTEXT migration + hybrid search

---

## API contract — cập nhật `POST /ai/product-search`

Response thêm trường:

```json
{
  "success": true,
  "data": {
    "query": "thuốc bổ gan nhật bản",
    "expanded_query": "thuốc bổ gan nhật, liver supplement Japan, 肝臓サプリ, silymarin",
    "count": 10,
    "items": [
      {
        "id": 3,
        "product_cd": "P003",
        "product_name": "Orihiro Liver Support 120",
        "product_name_jp": "肝臓サポート",
        "name_vi": "Viên uống bổ gan Orihiro 120 viên",
        "description_vi": "Hỗ trợ chức năng gan, giải độc, bổ sung ornithine và silymarin từ Nhật Bản",
        "spec": "120 viên",
        "ai_score": 0.912
      }
    ]
  }
}
```

---

## Checklist dev

```
Phase 1:
[ ] Migration thêm name_vi, description_vi
[ ] Cập nhật Product $fillable + validation
[ ] Cập nhật buildProductText() thêm name_vi
[ ] Cập nhật ProductController: trả name_vi trong response
[ ] Thêm field "Tên tiếng Việt" vào form tạo/sửa SP (FE)
[ ] Artisan: products:generate-vi (tự động dịch bằng GPT)
[ ] Chạy: products:generate-vi → products:embed --force
[ ] Test: tìm "vitamin c" → ra đúng SP

Phase 2:
[ ] Tạo QueryExpansionService
[ ] Đăng ký trong AppServiceProvider (DI)
[ ] Inject vào ProductEmbeddingService::search()
[ ] Thêm expanded_query vào API response
[ ] Test: tìm "gan" → query mở rộng → kết quả tốt hơn

Phase 3 (nếu cần):
[ ] Migration FULLTEXT index
[ ] Viết keywordSearch() và mergeResults()
[ ] A/B test: hybrid vs semantic only

Phase 4 (tùy chọn):
[ ] Thêm rerankWithGPT() sau hybrid search
[ ] Thêm env: AI_RERANK_ENABLED=true/false
```

---

## Chi phí ước tính (100 SP, 500 search/ngày)

| Action | Chi phí |
|--------|---------|
| `products:generate-vi` (100 SP, 1 lần) | ~$0.01 |
| `products:embed --force` (100 SP) | ~$0.01 |
| Query expansion (500 search/ngày) | ~$0.05/ngày = $1.5/tháng |
| Re-ranking Phase 4 (nếu bật) | ~$3/tháng |
| **Tổng** | **~$2–5/tháng thêm** |
