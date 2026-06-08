<?php

namespace App\Services\Ai;

/**
 * Intent classifier cho AI Chat nhân viên
 * spec: docs/sa/amendments/ai-conversation-upgrade.md § 3
 */
class IntentClassifier
{
    // Danh sách intent
    public const INTERNAL_SEARCH  = 'INTERNAL_SEARCH';
    public const RAKUTEN_DISCOVER = 'RAKUTEN_DISCOVER';
    public const PRICE_INQUIRY    = 'PRICE_INQUIRY';
    public const ORDER_STATUS     = 'ORDER_STATUS';
    public const INVOICE_INQUIRY  = 'INVOICE_INQUIRY';
    public const POLICY_QUESTION  = 'POLICY_QUESTION';
    public const GENERAL_CHAT     = 'GENERAL_CHAT';

    /** @var array<string, string[]> */
    private array $keywords = [
        self::RAKUTEN_DISCOVER => [
            'sản phẩm mới', 'tìm trên rakuten', 'muốn nhập thêm', 'sp nào hot', 'hàng mới',
            'khám phá', 'tìm kiếm mới', 'bên nhật có', 'nhật có bán',
        ],
        self::PRICE_INQUIRY => [
            'giá bao nhiêu', 'bán giá', 'tỷ giá', 'phí', 'fee', 'chi phí', 'giá tiền',
            'bao nhiêu tiền', 'giá cả', 'giá vnd', 'giá jpy', '¥', '₫',
        ],
        self::ORDER_STATUS => [
            'đơn hàng', 'đơn số', 'tình trạng đơn', 'đang ở đâu', 'đơn của tôi',
            'order', 'đặt hàng', 'trạng thái đơn', 'giao hàng chưa',
        ],
        self::INVOICE_INQUIRY => [
            'hóa đơn', 'công nợ', 'chưa thanh toán', 'nợ bao nhiêu', 'invoice',
            'thanh toán', 'tiền nợ', 'đã trả chưa', 'cần trả',
        ],
        self::POLICY_QUESTION => [
            'phí dịch vụ', 'điều khoản', 'quy trình', 'bao lâu', 'thời gian giao',
            'tối thiểu', 'đặt ít nhất', 'chính sách', 'quy định', 'điều kiện',
        ],
        self::INTERNAL_SEARCH => [
            'tìm', 'có không', 'catalog', 'sản phẩm nào', 'kiếm', 'tìm kiếm',
            'có sản phẩm', 'bán sản phẩm', 'danh sách', 'sản phẩm bổ',
            'tìm cho', 'giúp tôi tìm', 'gợi ý', 'đề xuất', 'muốn mua', 'cần tìm',
            'mỹ phẩm', 'cosmetic', 'skincare', 'vitamin', 'collagen', 'bổ gan',
            'thực phẩm chức năng', 'tpbvsk', 'kem dưỡng', 'son môi', 'sản phẩm tốt',
            'hàng nào', 'loại nào', 'nên dùng', 'nên nhập',
        ],
    ];

    /**
     * Phân loại intent từ message text.
     * Priority: RAKUTEN > PRICE > ORDER > INVOICE > POLICY > INTERNAL > GENERAL
     */
    public function classify(string $message): string
    {
        $lower = mb_strtolower($message);

        // Priority order — specific intents first
        $priority = [
            self::RAKUTEN_DISCOVER,
            self::PRICE_INQUIRY,
            self::ORDER_STATUS,
            self::INVOICE_INQUIRY,
            self::POLICY_QUESTION,
            self::INTERNAL_SEARCH,
        ];

        foreach ($priority as $intent) {
            foreach ($this->keywords[$intent] as $kw) {
                if (str_contains($lower, $kw)) {
                    return $intent;
                }
            }
        }

        return self::GENERAL_CHAT;
    }
}
