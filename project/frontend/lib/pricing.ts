/** unit_price_vnd = selling_price_jpy × rate × (1 + fee_rate) — spec invoice-payment.md */
export function calcUnitPriceVnd(
  sellingPriceJpy: number,
  exchangeRate: number,
  feeRate: number,
): number {
  if (!sellingPriceJpy || !exchangeRate) return 0;
  return Math.round(sellingPriceJpy * exchangeRate * (1 + feeRate));
}

/** fee_rate API: 0.05 → form percent: 5 */
export function feeRateToPercent(feeRate: number | string | null | undefined): number {
  const n = Number(feeRate);
  if (!n || Number.isNaN(n)) return 5;
  return n <= 1 ? Math.round(n * 1000) / 10 : n;
}

export function percentToFeeRate(percent: number | ""): number | null {
  if (percent === "" || percent == null) return null;
  return Math.round(Number(percent) * 100) / 10000;
}
