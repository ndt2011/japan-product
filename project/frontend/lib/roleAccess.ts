import { NAV_ITEMS, type UserType } from "@/lib/navigation";

export const ROLE_LABELS: Record<UserType, string> = {
  admin: "Admin (JP)",
  company: "Công ty VN / Đại lý",
  branch_manager: "Quản lý chi nhánh",
  branch_staff: "Nhân viên chi nhánh",
};

export const ROLE_DESCRIPTIONS: Record<UserType, string> = {
  admin: "Toàn quyền hệ thống: kho, báo cáo, quản trị, hóa đơn, công nợ",
  company: "Đặt hàng, xem sản phẩm, hóa đơn, chuyến hàng, báo cáo đơn",
  branch_manager: "Đơn hàng chi nhánh, báo cáo, quản lý NV chi nhánh",
  branch_staff: "Đặt hàng và xem sản phẩm cho chi nhánh được gán",
};

const ALL_ROLES: UserType[] = ["admin", "company", "branch_manager", "branch_staff"];

export function getMenusForRole(userType: UserType): string[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(userType)).map((item) => item.label);
}

export function getPermissionMatrix(): {
  module: string;
  group?: string;
  access: Record<UserType, boolean>;
}[] {
  return NAV_ITEMS.map((item) => ({
    module: item.label,
    group: item.group,
    access: Object.fromEntries(
      ALL_ROLES.map((role) => [role, item.roles.includes(role)]),
    ) as Record<UserType, boolean>,
  }));
}

export function roleBadgeVariant(
  userType: UserType,
): "primary" | "warning" | "info" | "gray" {
  switch (userType) {
    case "admin":
      return "primary";
    case "company":
      return "warning";
    case "branch_manager":
      return "info";
    default:
      return "gray";
  }
}
