<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn {{ $invoice->invoice_no }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 14px; color: #222; margin: 24px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { margin-top: 16px; width: 320px; margin-left: auto; }
        .totals td { border: none; padding: 4px 8px; }
        .totals tr:last-child td { font-weight: bold; font-size: 16px; }
    </style>
</head>
<body>
    <h1>HÓA ĐƠN {{ $invoice->invoice_no }}</h1>
    <p class="muted">Ngày lập: {{ $invoice->invoice_date?->format('d/m/Y') }} · Hạn thanh toán: {{ $invoice->due_date?->format('d/m/Y') }}</p>

    <p><strong>Khách hàng:</strong> {{ $invoice->company?->company_name }}<br>
    <strong>Đơn hàng:</strong> {{ $invoice->order?->order_no }}<br>
    <strong>Trạng thái:</strong> {{ strtoupper($invoice->status) }}</p>

    <table>
        <thead>
            <tr>
                <th>Sản phẩm</th>
                <th>SL</th>
                <th>Đơn giá (₫)</th>
                <th>Thành tiền (₫)</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format((int) $item->unit_price_vnd, 0, ',', '.') }}</td>
                <td>{{ number_format((int) $item->amount, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Tạm tính</td><td style="text-align:right">{{ number_format((int) $invoice->amount_vnd, 0, ',', '.') }} ₫</td></tr>
        <tr><td>Thuế VAT (10%)</td><td style="text-align:right">{{ number_format((int) $invoice->tax_amount, 0, ',', '.') }} ₫</td></tr>
        <tr><td>Tổng cộng</td><td style="text-align:right">{{ number_format((int) $invoice->total_amount, 0, ',', '.') }} ₫</td></tr>
    </table>

    @if ($invoice->note)
    <p style="margin-top:24px"><strong>Ghi chú:</strong> {{ $invoice->note }}</p>
    @endif
</body>
</html>
