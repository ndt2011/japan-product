<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Sinh mã chuẩn cho sản phẩm và đơn hàng.
 *
 * Format:
 *   product_cd : JP-{CAT3}-{SEQ5}
 *                JP-FOD-00012  (Thực phẩm, thứ 12 toàn hệ thống)
 *                JP-COS-00001  (Mỹ phẩm, đầu tiên)
 *
 *   order_no   : ORD-{YYYYMM}-{SEQ4}
 *                ORD-202606-0001  (Đơn đầu tiên tháng 6/2026)
 *
 * spec: docs/sa/amendments/product-tier-model.md § 2
 */
class CodeGeneratorService
{
    /**
     * Sinh product_cd tự động.
     *
     * @param  string|null  $categorySlug  Tên / slug danh mục (lấy 3 ký tự đầu, uppercase)
     */
    public function productCode(?string $categorySlug = null): string
    {
        $cat = $this->normalizeCat($categorySlug);

        // Sequence toàn cục (không theo category) để đảm bảo unique tuyệt đối
        $latest = Product::query()
            ->where('product_cd', 'like', "JP-%-%" )
            ->orderByDesc('id')
            ->value('product_cd');

        $seq = 1;
        if ($latest && preg_match('/JP-[A-Z]{3}-(\d{5})$/', $latest, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('JP-%s-%05d', $cat, $seq);
    }

    /**
     * Sinh order_no theo tháng.
     *
     * @param  string|null  $companyCode  Không bắt buộc — dùng khi muốn phân biệt công ty
     */
    public function orderNo(?string $companyCode = null): string
    {
        $ym = now()->format('Ym');   // e.g. 202606

        $prefix = "ORD-{$ym}";

        $latest = Order::query()
            ->where('order_no', 'like', "{$prefix}-%")
            ->orderByDesc('id')
            ->value('order_no');

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    /**
     * Chuẩn hóa 3 ký tự category viết hoa, không dấu.
     * Ví dụ: "Thực phẩm" → "THU", "Mỹ phẩm" → "MYP", null → "GEN"
     */
    private function normalizeCat(?string $raw): string
    {
        if (! $raw) {
            return 'GEN';
        }

        // Bỏ dấu tiếng Việt → ASCII
        $ascii = $this->removeAccents($raw);

        // Giữ chữ cái, uppercase, lấy 3 ký tự
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($ascii));

        if (strlen($letters) < 3) {
            $letters = str_pad($letters, 3, 'X');
        }

        return substr($letters, 0, 3);
    }

    /**
     * Chuyển ký tự có dấu sang không dấu (UTF-8).
     */
    private function removeAccents(string $str): string
    {
        $map = [
            'à' => 'a','á' => 'a','ả' => 'a','ã' => 'a','ạ' => 'a',
            'ă' => 'a','ắ' => 'a','ặ' => 'a','ằ' => 'a','ẵ' => 'a','ẳ' => 'a',
            'â' => 'a','ấ' => 'a','ậ' => 'a','ầ' => 'a','ẫ' => 'a','ẩ' => 'a',
            'è' => 'e','é' => 'e','ẻ' => 'e','ẽ' => 'e','ẹ' => 'e',
            'ê' => 'e','ế' => 'e','ệ' => 'e','ề' => 'e','ễ' => 'e','ể' => 'e',
            'ì' => 'i','í' => 'i','ỉ' => 'i','ĩ' => 'i','ị' => 'i',
            'ò' => 'o','ó' => 'o','ỏ' => 'o','õ' => 'o','ọ' => 'o',
            'ô' => 'o','ố' => 'o','ộ' => 'o','ồ' => 'o','ỗ' => 'o','ổ' => 'o',
            'ơ' => 'o','ớ' => 'o','ợ' => 'o','ờ' => 'o','ỡ' => 'o','ở' => 'o',
            'ù' => 'u','ú' => 'u','ủ' => 'u','ũ' => 'u','ụ' => 'u',
            'ư' => 'u','ứ' => 'u','ự' => 'u','ừ' => 'u','ữ' => 'u','ử' => 'u',
            'ỳ' => 'y','ý' => 'y','ỷ' => 'y','ỹ' => 'y','ỵ' => 'y',
            'đ' => 'd',
            'À' => 'A','Á' => 'A','Ả' => 'A','Ã' => 'A','Ạ' => 'A',
            'Ă' => 'A','Ắ' => 'A','Ặ' => 'A','Ằ' => 'A','Ẵ' => 'A','Ẳ' => 'A',
            'Â' => 'A','Ấ' => 'A','Ậ' => 'A','Ầ' => 'A','Ẫ' => 'A','Ẩ' => 'A',
            'È' => 'E','É' => 'E','Ẻ' => 'E','Ẽ' => 'E','Ẹ' => 'E',
            'Ê' => 'E','Ế' => 'E','Ệ' => 'E','Ề' => 'E','Ễ' => 'E','Ể' => 'E',
            'Ì' => 'I','Í' => 'I','Ỉ' => 'I','Ĩ' => 'I','Ị' => 'I',
            'Ò' => 'O','Ó' => 'O','Ỏ' => 'O','Õ' => 'O','Ọ' => 'O',
            'Ô' => 'O','Ố' => 'O','Ộ' => 'O','Ồ' => 'O','Ỗ' => 'O','Ổ' => 'O',
            'Ơ' => 'O','Ớ' => 'O','Ợ' => 'O','Ờ' => 'O','Ỡ' => 'O','Ở' => 'O',
            'Ù' => 'U','Ú' => 'U','Ủ' => 'U','Ũ' => 'U','Ụ' => 'U',
            'Ư' => 'U','Ứ' => 'U','Ự' => 'U','Ừ' => 'U','Ữ' => 'U','Ử' => 'U',
            'Ỳ' => 'Y','Ý' => 'Y','Ỷ' => 'Y','Ỹ' => 'Y','Ỵ' => 'Y',
            'Đ' => 'D',
        ];

        return strtr($str, $map);
    }
}
