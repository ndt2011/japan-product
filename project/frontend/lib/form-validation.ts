/** Inline form validation helpers — FE-V3-033 */

export type FieldErrors = Record<string, string>;

export const MSG = {
  required: "Trường này là bắt buộc.",
  email: "Email không hợp lệ.",
  minLength: (n: number) => `Tối thiểu ${n} ký tự.`,
  min: (n: number) => `Giá trị tối thiểu là ${n}.`,
  positive: "Phải là số dương.",
  integer: "Phải là số nguyên dương.",
  passwordMatch: "Mật khẩu xác nhận không khớp.",
  selectOne: "Vui lòng chọn ít nhất một mục.",
  url: "URL không hợp lệ (bắt đầu bằng http:// hoặc https://).",
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

function numVal(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function clearFieldError(errors: FieldErrors, field: string): FieldErrors {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

export function validateProductForm(
  form: {
    product_category_id: number | "";
    product_name: string;
    product_name_jp?: string;
    spec?: string;
    unit?: string;
    price_vnd?: number | "";
    cost_price_jpy?: number | "";
  },
  isAdmin: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.product_category_id) errors.product_category_id = MSG.required;
  if (!str(form.product_name)) errors.product_name = MSG.required;
  else if (str(form.product_name).length < 2) errors.product_name = MSG.minLength(2);
  if (isAdmin && !str(form.product_name_jp)) errors.product_name_jp = MSG.required;
  if (!str(form.spec)) errors.spec = MSG.required;
  if (!str(form.unit)) errors.unit = MSG.required;
  if (isAdmin) {
    const cost = numVal(form.cost_price_jpy);
    if (cost === null || cost < 0) errors.cost_price_jpy = MSG.required;
    const price = numVal(form.price_vnd);
    if (price === null || price < 0) errors.price_vnd = MSG.required;
  }
  return errors;
}

export function validateOrderLines(
  lines: Array<{ product_id: number | ""; quantity: number }>,
): FieldErrors {
  const errors: FieldErrors = {};
  let hasValidLine = false;
  lines.forEach((line, i) => {
    if (!line.product_id) {
      errors[`lines.${i}.product_id`] = MSG.required;
    }
    if (!line.quantity || line.quantity < 1) {
      errors[`lines.${i}.quantity`] = MSG.min(1);
    }
    if (line.product_id && line.quantity >= 1) hasValidLine = true;
  });
  if (!hasValidLine) errors._form = "Thêm ít nhất một sản phẩm hợp lệ.";
  return errors;
}

export function validateProfileForm(
  form: {
    full_name: string;
    contact_name: string;
    email: string;
    avatar_url: string;
    password: string;
    password_confirmation: string;
  },
  userType: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (userType === "company") {
    if (!str(form.contact_name)) errors.contact_name = MSG.required;
  } else if (!str(form.full_name)) {
    errors.full_name = MSG.required;
  }
  if (str(form.email) && !EMAIL_RE.test(str(form.email))) errors.email = MSG.email;
  if (str(form.avatar_url) && !/^https?:\/\/.+/i.test(str(form.avatar_url))) {
    errors.avatar_url = MSG.url;
  }
  if (form.password) {
    if (form.password.length < 8) errors.password = MSG.minLength(8);
    if (form.password !== form.password_confirmation) {
      errors.password_confirmation = MSG.passwordMatch;
    }
  }
  return errors;
}

export function validateStockMovement(form: {
  warehouse_id: string;
  product_id: string;
  quantity: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.warehouse_id) errors.warehouse_id = MSG.required;
  const pid = numVal(form.product_id);
  if (pid === null || pid < 1) errors.product_id = MSG.integer;
  const qty = numVal(form.quantity);
  if (qty === null || qty < 1) errors.quantity = MSG.positive;
  return errors;
}

export function validateInventoryCheck(form: {
  warehouse_id: string;
  product_id: string;
  actual_qty: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.warehouse_id) errors.warehouse_id = MSG.required;
  const pid = numVal(form.product_id);
  if (pid === null || pid < 1) errors.product_id = MSG.integer;
  const qty = numVal(form.actual_qty);
  if (qty === null || qty < 0) errors.actual_qty = MSG.min(0);
  return errors;
}

export function validateInventoryEdit(form: { min_stock_qty: string }): FieldErrors {
  const errors: FieldErrors = {};
  const min = numVal(form.min_stock_qty);
  if (min === null || min < 0) errors.min_stock_qty = MSG.min(0);
  return errors;
}

export function validateCategoryName(name: string): FieldErrors {
  return str(name) ? {} : { category_name: MSG.required };
}

export function validateWarehouseForm(form: { warehouse_name: string }): FieldErrors {
  return str(form.warehouse_name) ? {} : { warehouse_name: MSG.required };
}

export function validateShipmentForm(batchName: string, selectedCount: number): FieldErrors {
  const errors: FieldErrors = {};
  if (!str(batchName)) errors.batch_name = MSG.required;
  if (selectedCount < 1) errors.order_ids = MSG.selectOne;
  return errors;
}

export function validatePurchasingQuery(query: string): FieldErrors {
  const q = str(query);
  if (!q) return { query: MSG.required };
  if (q.length < 3) return { query: MSG.minLength(3) };
  return {};
}

export function validateBranchForm(form: {
  branch_cd: string;
  branch_name: string;
  province: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!str(form.branch_cd)) errors.branch_cd = MSG.required;
  if (!str(form.branch_name)) errors.branch_name = MSG.required;
  if (!str(form.province)) errors.province = MSG.required;
  return errors;
}

export function validateBranchUserForm(form: {
  login_id: string;
  password: string;
  full_name: string;
  email: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!str(form.login_id)) errors.login_id = MSG.required;
  if (!str(form.password)) errors.password = MSG.required;
  else if (form.password.length < 8) errors.password = MSG.minLength(8);
  if (!str(form.full_name)) errors.full_name = MSG.required;
  if (str(form.email) && !EMAIL_RE.test(str(form.email))) errors.email = MSG.email;
  return errors;
}

export function validateAdminUserForm(form: {
  login_id: string;
  password: string;
  full_name: string;
  email: string;
}): FieldErrors {
  return validateBranchUserForm(form);
}

export function validateCompanyUserForm(form: {
  login_id: string;
  password: string;
  company_name: string;
  contact_name: string;
  email: string;
}): FieldErrors {
  const errors = validateBranchUserForm({
    login_id: form.login_id,
    password: form.password,
    full_name: form.company_name,
    email: form.email,
  });
  if (!str(form.company_name)) errors.company_name = MSG.required;
  return errors;
}
