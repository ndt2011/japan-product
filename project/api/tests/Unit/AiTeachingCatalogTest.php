<?php

namespace Tests\Unit;

use App\Services\Ai\AiTeachingCatalogService;
use Tests\TestCase;

class AiTeachingCatalogTest extends TestCase
{
    public function test_loads_global_teaching_categories(): void
    {
        $service = new AiTeachingCatalogService;
        $catalog = $service->loadForBranch(null);

        $this->assertNotEmpty($catalog['categories']);
        $this->assertArrayHasKey('mỹ phẩm tốt', $service->viToJpMap(null));
    }

    public function test_suggests_search_from_interests(): void
    {
        $service = new AiTeachingCatalogService;
        $suggestion = $service->suggestSearchFromInterests(['vitamin c'], null);

        $this->assertNotNull($suggestion);
        $this->assertStringContainsString('vitamin', mb_strtolower((string) $suggestion));
    }
}
