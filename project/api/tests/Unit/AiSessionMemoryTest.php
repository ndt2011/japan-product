<?php

namespace Tests\Unit;

use App\Services\Ai\AiSessionMemoryService;
use App\Services\Ai\IntentClassifier;
use PHPUnit\Framework\TestCase;

class AiSessionMemoryTest extends TestCase
{
    private AiSessionMemoryService $memory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->memory = new AiSessionMemoryService;
    }

    public function test_resolves_vague_more_from_interests(): void
    {
        $resolved = $this->memory->resolveMessageWithContext('gợi ý thêm đi', [
            'interests' => ['mỹ phẩm', 'vitamin c'],
        ]);

        $this->assertStringContainsString('mỹ phẩm', mb_strtolower($resolved));
    }

    public function test_resolves_similar_from_last_search(): void
    {
        $resolved = $this->memory->resolveMessageWithContext('có loại tương tự không', [
            'last_search_query' => 'collagen nhật',
        ]);

        $this->assertSame('collagen nhật tương tự', $resolved);
    }

    public function test_updates_session_after_product_search(): void
    {
        $updated = $this->memory->updateFromTurn(
            ['interests' => []],
            'Tìm mỹ phẩm DHC cho tôi',
            IntentClassifier::INTERNAL_SEARCH,
            [
                'search_query' => 'mỹ phẩm dhc',
                'products' => [
                    ['id' => 1, 'name_vi' => 'Kem DHC', 'product_name' => 'DHC Cream'],
                ],
            ],
        );

        $this->assertContains('mỹ phẩm', $updated['interests']);
        $this->assertSame('mỹ phẩm dhc', $updated['last_search_query']);
        $this->assertSame([1], $updated['last_product_ids']);
    }
}
