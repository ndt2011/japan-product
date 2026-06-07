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
}

export interface ProductItem {
  id: number;
  product_cd: string | null;
  product_name: string;
  product_name_jp: string | null;
  cost_jpy: number | null;
  price_vnd: number | null;
  supplier_name?: string | null;
  category_name?: string | null;
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
