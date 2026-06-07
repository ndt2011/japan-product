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

export interface ProductListData {
  items: ProductItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
