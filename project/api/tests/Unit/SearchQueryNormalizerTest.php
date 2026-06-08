<?php

namespace Tests\Unit;

use App\Services\Ai\SearchQueryNormalizer;
use PHPUnit\Framework\TestCase;

class SearchQueryNormalizerTest extends TestCase
{
    private SearchQueryNormalizer $normalizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->normalizer = new SearchQueryNormalizer;
    }

    public function test_extracts_cosmetics_from_polite_vietnamese(): void
    {
        $this->assertSame(
            'mỹ phẩm tốt',
            $this->normalizer->extract('Tìm cho tôi mỹ phẩm tốt nhé'),
        );
    }

    public function test_extracts_vitamin_query(): void
    {
        $this->assertSame(
            'vitamin c nhật bản',
            $this->normalizer->extract('Giúp tôi tìm vitamin C Nhật Bản'),
        );
    }

    public function test_keeps_short_keyword(): void
    {
        $this->assertSame('dhc', $this->normalizer->extract('DHC'));
    }
}
