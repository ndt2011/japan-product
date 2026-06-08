/**
 * Gợi ý tìm catalog — theo docs/sa/amendments/ai-search-improvement.md
 */
export interface CatalogSearchPrompt {
  label: string;
  query: string;
  hint?: string;
}

export const AI_CATALOG_SEARCH_PROMPTS: CatalogSearchPrompt[] = [
  {
    label: "Bổ gan",
    query: "thuốc bổ gan nhật bản",
    hint: "GPT mở rộng → 肝臓サプリ, liver supplement",
  },
  {
    label: "Vitamin C",
    query: "vitamin c nhật bản",
    hint: "→ ビタミンC, DHC, Fancl",
  },
  {
    label: "Collagen",
    query: "collagen nhật bản",
    hint: "→ コラーゲン, peptide",
  },
  {
    label: "TPCN",
    query: "thực phẩm chức năng",
  },
  {
    label: "DHC",
    query: "DHC",
  },
  {
    label: "コラーゲン",
    query: "コラーゲン",
  },
];
