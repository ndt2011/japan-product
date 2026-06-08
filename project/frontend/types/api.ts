export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors: Record<string, string[]> | null;
}

export type UserType = "admin" | "company" | "branch_manager" | "branch_staff";

export interface BranchSummary {
  id: number;
  branch_cd: string;
  branch_name: string;
  region: string;
  province: string;
}

export interface AuthUser {
  id: number;
  login_id: string;
  user_type: UserType;
  full_name?: string;
  company_name?: string;
  email?: string;
  role?: "manager" | "staff";
  branch_id?: number | null;
  branch?: BranchSummary | null;
  company_cd?: string;
  contact_name?: string;
}

export interface BranchItem {
  id: number;
  branch_cd: string;
  branch_name: string;
  region: string;
  province: string;
  address?: string | null;
  tel?: string | null;
  disabled_flag: boolean;
  users_count?: number;
}

export interface AdminUserItem {
  id: number;
  login_id: string;
  full_name: string;
  email?: string | null;
  user_type: "admin";
  disabled_flag: boolean;
}

export interface CompanyUserItem {
  id: number;
  login_id: string;
  company_cd?: string | null;
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  user_type: "company";
  disabled_flag: boolean;
}

export interface ProductBranchStat {
  branch_id: number;
  branch_name: string;
  region: string;
  province: string;
  total_ordered: number;
  pending_qty: number;
  delivered_qty: number;
  last_order_date: string | null;
}

export interface BranchUserItem {
  id: number;
  branch_id: number;
  login_id: string;
  full_name: string;
  email?: string | null;
  role: "manager" | "staff";
  user_type: UserType;
  disabled_flag: boolean;
}

export interface LoginData {
  user: AuthUser;
  token: string;
  token_type: string;
  expires_at?: string;
}

export interface ProductImageItem {
  id: number;
  product_id: number;
  image_path: string;
  is_primary: boolean;
  order_no: number;
}

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface ProductItem {
  id: number;
  product_category_id?: number | null;
  product_cd: string | null;
  product_name: string;
  product_name_jp: string | null;
  name_vi?: string | null;
  description_vi?: string | null;
  spec?: string | null;
  unit?: string | null;
  cost_jpy: number | null;
  cost_price_jpy?: number | string | null;
  selling_price_jpy?: number | string | null;
  fee_rate?: number | string | null;
  unit_price_vnd?: number | string | null;
  price_vnd: number | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  category_name?: string | null;
  origin?: string | null;
  import_tax_rate?: number | null;
  description?: string | null;
  /** URL ảnh chính (từ product_images, đã qua CDN). spec: product-tier-model.md § 3 */
  primary_image_url?: string | null;
  /** Legacy — giữ tương thích ngược */
  image_path?: string | null;
  images?: ProductImageItem[];
  memo?: string | null;
  disabled_flag: boolean;
  /** Số lượng có thể đặt hàng = quantity − reserved_qty */
  available_qty?: number;
  /** IN_STOCK ≥10 | LOW_STOCK 1-9 | OUT_OF_STOCK = 0 */
  stock_status?: StockStatus;
  /** Legacy aggregate (admin only) */
  inventory_total?: number | null;
}

export interface ProductDetailData {
  product: ProductItem;
}

export interface CategoryOption {
  id: number;
  category_name: string;
}

export interface SupplierOption {
  id: number;
  supplier_name: string;
}

export interface OrderCostItem {
  id: number;
  order_id: number;
  cost_type: string;
  amount_vnd: string;
  note?: string | null;
  created?: string | null;
}

export interface ProfitReportSummary {
  total_revenue_vnd: number;
  total_cost_vnd: number;
  gross_profit_vnd: number;
  total_other_costs_vnd: number;
  net_profit_vnd: number;
  profit_margin_pct: number;
  order_count: number;
}

export interface ProfitReportOrderRow {
  order_id: number;
  order_no: string;
  completed_at: string | null;
  revenue_vnd: number;
  cost_vnd: number;
  gross_profit_vnd: number;
  other_costs_vnd: number;
  net_profit_vnd: number;
}

export interface ProfitReportProductRow {
  product_id: number;
  product_cd: string;
  product_name: string;
  product_name_vi: string | null;
  quantity_sold: number;
  revenue_vnd: number;
  cost_vnd: number;
  gross_profit_vnd: number;
  other_costs_vnd: number;
  net_profit_vnd: number;
}

export interface ExchangeRateData {
  from_currency: string;
  to_currency: string;
  rate: number;
}

export interface ProductFormData {
  product_category_id: number | "";
  product_cd: string;
  product_name: string;
  product_name_jp: string;
  name_vi: string;
  description_vi: string;
  supplier_id: number | "";
  spec: string;
  unit: string;
  cost_jpy: number | "";
  cost_price_jpy: number | "";
  selling_price_jpy: number | "";
  fee_rate_percent: number | "";
  price_vnd: number | "";
  import_tax_rate: number | "";
  origin: string;
  description: string;
  memo: string;
  disabled_flag: boolean;
}

export interface AiCatalogSearchItem {
  id: number;
  product_cd: string | null;
  product_name: string;
  product_name_jp: string | null;
  name_vi?: string | null;
  description_vi?: string | null;
  ai_score?: number;
  spec?: string | null;
  unit?: string | null;
  cost_jpy?: number | null;
  price_vnd?: number | null;
  origin?: string | null;
  import_tax_rate?: string | number | null;
  category?: string | null;
  supplier?: string | null;
  image_url?: string | null;
  images?: { url: string; is_primary: boolean; order_no: number }[];
}

export interface AiCatalogSearchData {
  query: string;
  count: number;
  items: AiCatalogSearchItem[];
}

export interface AiSearchItem {
  external_id?: string;
  product_name_jp: string;
  product_name_vn?: string | null;
  image_url?: string | null;
  price_jpy?: number | null;
  source_url?: string | null;
  source_platform?: string | null;
  description?: string | null;
  data_source?: "rakuten_api" | "openai" | string | null;
  genre_name?: string | null;
  suggested_category_id?: number | null;
  suggested_category_name?: string | null;
  usage_instructions?: string | null;
  spec?: string | null;
}

export interface PricingPreview {
  exchange_rate: number;
  markup_percent: number;
  cost_jpy: number;
  price_vnd: number | null;
}

export interface AiSearchSession {
  id: number;
  keyword: string;
  status: "processing" | "completed" | "failed" | "timeout";
  items?: AiSearchItem[];
  error_message?: string | null;
}

export interface AiCandidateItem {
  id: number;
  ai_search_session_id?: number | null;
  product_name_jp: string;
  product_name_vn?: string | null;
  image_url?: string | null;
  price_jpy?: number | null;
  source_url?: string | null;
  source_platform?: string | null;
  description?: string | null;
  suggested_category_id?: number | null;
  suggested_category_name?: string | null;
  usage_instructions?: string | null;
  spec?: string | null;
  data_source?: string | null;
  pricing?: PricingPreview;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reject_reason?: string | null;
  product_id?: number | null;
}

export interface OrderItem {
  id: number;
  order_no: string;
  company_vn_id: number;
  company_name?: string | null;
  branch_id?: number | null;
  branch_name?: string | null;
  status: string;
  order_date?: string | null;
  total_jpy?: string | null;
  total_vnd?: string | null;
  exchange_rate?: number | null;
  items_count?: number;
  details?: OrderLineItem[];
}

export interface OrderLineItem {
  id: number;
  product_id: number;
  product_name?: string | null;
  product_cd?: string | null;
  quantity: number;
  unit_price_jpy?: number | null;
  unit_price_vnd?: string | null;
  subtotal_vnd?: string | null;
}

export interface OrderListData {
  items: OrderItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface OrderDetailData {
  order: OrderItem;
}

export interface ShipmentBatchOrderRef {
  id: number;
  order_no: string;
  company_name?: string | null;
  status: string;
  total_vnd?: string | null;
}

export interface ShipmentBatchItem {
  id: number;
  batch_no: string;
  batch_name: string;
  status: string;
  logistics_partner?: string | null;
  tracking_number?: string | null;
  estimated_departure_date?: string | null;
  created_admin_name?: string | null;
  orders_count?: number;
  orders?: ShipmentBatchOrderRef[];
}

export interface ShipmentBatchListData {
  items: ShipmentBatchItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ShipmentBatchDetailData {
  batch: ShipmentBatchItem;
}

export interface ProductListData {
  items: ProductItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface InvoiceLineItem {
  id: number;
  order_detail_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price_vnd: string;
  amount: string;
}

export interface InvoiceItem {
  id: number;
  order_id: number;
  order_no?: string | null;
  company_vn_id: number;
  company_name?: string | null;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  amount_vnd: string;
  tax_amount: string;
  total_amount: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  paid_at?: string | null;
  paid_amount?: string | null;
  payment_method?: string | null;
  note?: string | null;
  items?: InvoiceLineItem[];
}

export interface InvoiceListData {
  items: InvoiceItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface InvoiceDetailData {
  invoice: InvoiceItem;
}

export interface DebtSummaryData {
  total_unpaid_vnd: number;
  total_overdue_vnd: number;
  invoice_count: number;
  overdue_count: number;
  items: {
    id: number;
    invoice_no: string;
    company_name?: string | null;
    status: string;
    due_date: string;
    total_amount: string;
    days_overdue: number;
  }[];
}
