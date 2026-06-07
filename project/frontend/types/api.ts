export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors: Record<string, string[]> | null;
}

export interface AuthUser {
  id: number;
  login_id: string;
  user_type: "admin" | "company";
  full_name?: string;
  company_name?: string;
  email?: string;
  branch_id?: number | null;
  company_cd?: string;
  contact_name?: string;
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

export interface ProductItem {
  id: number;
  product_category_id?: number | null;
  product_cd: string | null;
  product_name: string;
  product_name_jp: string | null;
  spec?: string | null;
  unit?: string | null;
  cost_jpy: number | null;
  price_vnd: number | null;
  supplier_id?: number | null;
  supplier_name?: string | null;
  category_name?: string | null;
  origin?: string | null;
  import_tax_rate?: number | null;
  description?: string | null;
  image_path?: string | null;
  images?: ProductImageItem[];
  memo?: string | null;
  disabled_flag: boolean;
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
  supplier_id: number | "";
  spec: string;
  unit: string;
  cost_jpy: number | "";
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
  image_url?: string | null;
  price_jpy?: number | null;
  source_url?: string | null;
  source_platform?: string | null;
  description?: string | null;
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
  status: "PENDING" | "APPROVED" | "REJECTED";
  reject_reason?: string | null;
  product_id?: number | null;
}

export interface OrderItem {
  id: number;
  order_no: string;
  company_vn_id: number;
  company_name?: string | null;
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
