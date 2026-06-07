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
                'status' => 'PENDING',
                'created_user_type' => $userType,
                'created_user_id' => $userId,
                'created' => now(),
                'deleted_flag' => false,
            ];
        }

        return $this->candidateRepository->createMany($rows);
    }

    public function approve(int $id, array $data, Authenticatable $reviewer, string $reviewerType): AiProductCandidate
    {
        $candidate = $this->show($id);

        if ($candidate->status !== 'PENDING') {
            throw new AiSearchException('M0001', 409);
        }

        $product = $this->productService->store([
            'product_category_id' => $data['product_category_id'],
            'product_cd' => $data['product_cd'] ?? null,
            'product_name' => $data['product_name_vn'] ?? $data['product_name'] ?? $candidate->product_name_jp,
            'product_name_jp' => $candidate->product_name_jp,
            'cost_jpy' => $data['cost_jpy'] ?? $candidate->price_jpy,
            'price_vnd' => $data['price_vnd'] ?? null,
            'description' => $data['description'] ?? $candidate->description,
            'image_path' => $candidate->image_url,
            'origin' => $data['origin'] ?? 'Nhật Bản',
            'disabled_flag' => false,
        ]);

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
}
