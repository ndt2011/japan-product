<?php

namespace App\Services;

use App\Exceptions\AiSearchException;
use App\Models\AiProductCandidate;
use App\Repositories\AiProductCandidateRepository;
use App\Repositories\AiSearchSessionRepository;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AiProductCandidateService
{
    public function __construct(
        private readonly AiProductCandidateRepository $candidateRepository,
        private readonly AiSearchSessionRepository $sessionRepository,
        private readonly ProductService $productService,
        private readonly ProductImageService $productImageService,
        private readonly ProductPricingService $pricingService,
        private readonly NotificationService $notificationService,
    ) {}

    public function list(?string $status, int $perPage = 20): LengthAwarePaginator
    {
        return $this->candidateRepository->paginateByStatus($status, $perPage);
    }

    public function show(int $id): AiProductCandidate
    {
        $candidate = $this->candidateRepository->find($id);

        if (! $candidate) {
            throw new AiSearchException('M0002', 404);
        }

        return $candidate;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public function submit(
        array $items,
        string $userType,
        int $userId,
        ?int $sessionId = null,
    ): Collection {
        if ($items === []) {
            throw new AiSearchException('M0001', 422);
        }

        if ($sessionId) {
            $session = $this->sessionRepository->find($sessionId);

            if (! $session || $session->user_type !== $userType || (int) $session->user_id !== $userId) {
                throw new AiSearchException('M0002', 404);
            }
        }

        $rows = [];

        foreach ($items as $item) {
            $rows[] = [
                'ai_search_session_id' => $sessionId,
                'product_name_jp' => $item['product_name_jp'],
                'product_name_vn' => $item['product_name_vn'] ?? null,
                'image_url' => $item['image_url'] ?? null,
                'price_jpy' => $item['price_jpy'] ?? null,
                'source_url' => $item['source_url'] ?? null,
                'source_platform' => $item['source_platform'] ?? null,
                'description' => $item['description'] ?? null,
                'suggested_category_id' => $item['suggested_category_id'] ?? null,
                'suggested_category_name' => $item['suggested_category_name'] ?? null,
                'usage_instructions' => $item['usage_instructions'] ?? null,
                'spec' => $item['spec'] ?? null,
                'data_source' => $item['data_source'] ?? null,
                'status' => 'PENDING',
                'created_user_type' => $userType,
                'created_user_id' => $userId,
                'created' => now(),
                'deleted_flag' => false,
            ];
        }

        $created = $this->candidateRepository->createMany($rows);

        $this->notificationService->notifyAllAdmins(
            'AI_CANDIDATE_PENDING',
            'Có '.count($rows).' sản phẩm AI chờ duyệt',
            'Vào màn Duyệt AI để xem chi tiết.',
            'ai_candidate',
            $created->first()?->id,
        );

        return $created;
    }

    public function approve(int $id, array $data, Authenticatable $reviewer, string $reviewerType): AiProductCandidate
    {
        $candidate = $this->show($id);

        if ($candidate->status !== 'PENDING') {
            throw new AiSearchException('M0001', 409);
        }

        $costJpy = (int) ($data['cost_jpy'] ?? $candidate->price_jpy ?? 0);
        $priceVnd = isset($data['price_vnd'])
            ? (int) $data['price_vnd']
            : $this->pricingService->calculateSellingPriceVnd($costJpy > 0 ? $costJpy : null);

        $description = $this->buildProductDescription($candidate, $data);

        $product = $this->productService->store([
            'product_category_id' => $data['product_category_id'],
            'product_cd' => $data['product_cd'] ?? null,
            'product_name' => $data['product_name_vn'] ?? $data['product_name'] ?? $candidate->product_name_vn ?? $candidate->product_name_jp,
            'product_name_jp' => $candidate->product_name_jp,
            'spec' => $data['spec'] ?? $candidate->spec,
            'cost_jpy' => $costJpy > 0 ? $costJpy : null,
            'price_vnd' => $priceVnd,
            'description' => $description,
            'origin' => $data['origin'] ?? 'Nhật Bản',
            'memo' => $this->buildProductMemo($candidate),
            'disabled_flag' => false,
        ]);

        if ($candidate->image_url) {
            $imported = $this->productImageService->importFromUrl($product->id, $candidate->image_url, true);

            if (! $imported) {
                $this->productService->update($product->id, [
                    'image_path' => $candidate->image_url,
                ]);
            }
        }

        return $this->candidateRepository->update($candidate, [
            'status' => 'APPROVED',
            'product_name_vn' => $data['product_name_vn'] ?? $candidate->product_name_vn,
            'product_id' => $product->id,
            'reviewed_user_type' => $reviewerType,
            'reviewed_user_id' => $reviewer->id,
            'modified' => now(),
        ]);
    }

    public function reject(int $id, string $reason, Authenticatable $reviewer, string $reviewerType): AiProductCandidate
    {
        $candidate = $this->show($id);

        if ($candidate->status !== 'PENDING') {
            throw new AiSearchException('M0001', 409);
        }

        return $this->candidateRepository->update($candidate, [
            'status' => 'REJECTED',
            'reject_reason' => $reason,
            'reviewed_user_type' => $reviewerType,
            'reviewed_user_id' => $reviewer->id,
            'modified' => now(),
        ]);
    }

    private function buildProductDescription(AiProductCandidate $candidate, array $data): ?string
    {
        $parts = array_filter([
            $data['description'] ?? $candidate->description,
            $candidate->usage_instructions ? "Cách dùng:\n{$candidate->usage_instructions}" : null,
            $candidate->source_url ? "Link tham khảo: {$candidate->source_url}" : null,
        ]);

        if ($parts === []) {
            return null;
        }

        return implode("\n\n", $parts);
    }

    private function buildProductMemo(AiProductCandidate $candidate): ?string
    {
        $parts = array_filter([
            $candidate->data_source ? "Nguồn dữ liệu: {$candidate->data_source}" : null,
            $candidate->source_platform ? "Sàn: {$candidate->source_platform}" : null,
            $candidate->price_jpy ? "Giá gốc JPY lúc tìm: ¥".number_format($candidate->price_jpy) : null,
        ]);

        return $parts === [] ? null : implode(' | ', $parts);
    }
}
