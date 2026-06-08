# Seed + test đầy đủ trên staging API (dùng curl.exe)
$Base = "https://product-production-7e4e.up.railway.app/api"
$Tmp = $env:TEMP

function Curl-Json {
    param(
        [string]$Method = "GET",
        [string]$Path,
        [string]$Token = "",
        [string]$BodyFile = ""
    )
    $url = "$Base$Path"
    $args = @("-s", "-m", "60", $url, "-H", "Accept: application/json")
    if ($Method -ne "GET") { $args = @("-s", "-m", "60", "-X", $Method) + $args[2..($args.Length - 1)] }
    if ($Token) { $args += @("-H", "Authorization: Bearer $Token") }
    if ($BodyFile) { $args += @("-H", "Content-Type: application/json", "--data-binary", "@$BodyFile") }
    $out = & curl.exe @args
    if (-not $out) { throw "Empty response from $Method $url" }
    return $out | ConvertFrom-Json
}

Write-Host "=== 1. Login ===" -ForegroundColor Cyan
Set-Content -Path "$Tmp\login-admin.json" -Value '{"login_id":"admin","password":"Admin@123","remember_me":false}' -Encoding ascii
Set-Content -Path "$Tmp\login-co.json" -Value '{"login_id":"vn_company01","password":"Company@123","remember_me":false}' -Encoding ascii
$adminLogin = Curl-Json -Method POST -Path "/auth/login" -BodyFile "$Tmp\login-admin.json"
$coLogin = Curl-Json -Method POST -Path "/auth/login" -BodyFile "$Tmp\login-co.json"
$adminToken = $adminLogin.data.token
$coToken = $coLogin.data.token
Write-Host "Admin + Company OK"

Write-Host "`n=== 2. Warehouse + Stock ===" -ForegroundColor Cyan
$warehouses = Curl-Json -Path "/warehouses" -Token $adminToken
$whId = $warehouses.data.items[0].id
if (-not $whId) {
    Set-Content -Path "$Tmp\wh.json" -Value '{"warehouse_cd":"WH-VN-01","warehouse_name":"Kho Ha Noi VN","country":"VN"}' -Encoding ascii
    $wh = Curl-Json -Method POST -Path "/warehouses" -Token $adminToken -BodyFile "$Tmp\wh.json"
    $whId = $wh.data.warehouse.id
}
Write-Host "Warehouse id=$whId"

$products = Curl-Json -Path "/products?per_page=3" -Token $adminToken
$productId1 = $products.data.items[0].id
$productId2 = if ($products.data.items.Count -gt 1) { $products.data.items[1].id } else { $productId1 }

foreach ($productId in @($productId1, $productId2)) {
    Set-Content -Path "$Tmp\stock.json" -Value "{`"movement_type`":`"IN`",`"product_id`":$productId,`"warehouse_id`":$whId,`"quantity`":50,`"reason`":`"E2E seed`"}" -Encoding ascii
    try { Curl-Json -Method POST -Path "/stock-movements" -Token $adminToken -BodyFile "$Tmp\stock.json" | Out-Null } catch {}
}
Write-Host "Stock IN products $productId1, $productId2"

Write-Host "`n=== 3. Order flow ===" -ForegroundColor Cyan
$profitBefore = Curl-Json -Path "/reports/profit" -Token $adminToken
if ([int]$profitBefore.data.summary.order_count -eq 0) {
    Set-Content -Path "$Tmp\order.json" -Value "{`"submit`":true,`"items`":[{`"product_id`":$productId1,`"quantity`":2},{`"product_id`":$productId2,`"quantity`":1}]}" -Encoding ascii
    $order = Curl-Json -Method POST -Path "/orders" -Token $coToken -BodyFile "$Tmp\order.json"
    $orderId = $order.data.order.id
    Write-Host "Order PENDING id=$orderId"

    Curl-Json -Method PUT -Path "/orders/$orderId/confirm" -Token $adminToken | Out-Null
    Write-Host "CONFIRMED"

    Set-Content -Path "$Tmp\batch.json" -Value "{`"batch_name`":`"E2E batch`",`"order_ids`":[$orderId]}" -Encoding ascii
    $batch = Curl-Json -Method POST -Path "/shipment-batches" -Token $adminToken -BodyFile "$Tmp\batch.json"
    $batchId = $batch.data.batch.id
    foreach ($st in @("CUSTOMS_JP", "IN_TRANSIT", "CUSTOMS_VN", "DELIVERED")) {
        Set-Content -Path "$Tmp\status.json" -Value "{`"status`":`"$st`"}" -Encoding ascii
        Curl-Json -Method PUT -Path "/shipment-batches/$batchId/status" -Token $adminToken -BodyFile "$Tmp\status.json" | Out-Null
    }
    Write-Host "Shipment DELIVERED"

    Curl-Json -Method PUT -Path "/orders/$orderId/confirm-receipt" -Token $coToken | Out-Null
    Write-Host "COMPLETED"
} else {
    Write-Host "Already have $($profitBefore.data.summary.order_count) COMPLETED orders"
}

Write-Host "`n=== 4. Invoice PDF ===" -ForegroundColor Cyan
$invoices = Curl-Json -Path "/invoices?per_page=1" -Token $adminToken
$invId = $invoices.data.items[0].id
if ($invId) {
    if ($invoices.data.items[0].status -eq "draft") {
        Curl-Json -Method POST -Path "/invoices/$invId/send" -Token $adminToken | Out-Null
    }
    $pdfOut = "$Tmp\staging-inv-$invId.pdf"
    & curl.exe -s -m 60 -H "Authorization: Bearer $adminToken" "$Base/invoices/$invId/pdf" -o $pdfOut
    $invDetail = Curl-Json -Path "/invoices/$invId" -Token $adminToken
    $size = (Get-Item $pdfOut).Length
    Write-Host "Invoice $invId pdf_path=$($invDetail.data.invoice.pdf_path) bytes=$size"
} else { Write-Host "No invoice" }

Write-Host "`n=== 5. Reports ===" -ForegroundColor Cyan
$profit = Curl-Json -Path "/reports/profit" -Token $adminToken
$byProd = Curl-Json -Path "/reports/profit/by-product?limit=5" -Token $adminToken
Write-Host "Profit: orders=$($profit.data.summary.order_count) revenue=$($profit.data.summary.total_revenue_vnd) net=$($profit.data.summary.net_profit_vnd)"
Write-Host "By-product: $($byProd.data.items.Count) items"

Write-Host "`n=== 6. AI Chat ===" -ForegroundColor Cyan
Set-Content -Path "$Tmp\chat.json" -Value '{"message":"Tong don hang dang xu ly?"}' -Encoding ascii
$ai = Curl-Json -Method POST -Path "/ai/chat" -Token $adminToken -BodyFile "$Tmp\chat.json"
Write-Host "AI: $($ai.data.reply.Substring(0, [Math]::Min(100, $ai.data.reply.Length)))"

Write-Host "`n=== 7. Dashboard ===" -ForegroundColor Cyan
$dash = Curl-Json -Path "/dashboard/stats" -Token $adminToken
Write-Host "Dashboard: today=$($dash.data.orders_today) month=$($dash.data.orders_month) revenue=$($dash.data.revenue_month_vnd)"

Write-Host "`n=== DONE ===" -ForegroundColor Green
