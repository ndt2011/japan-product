import { AppShell } from "@/components/layout/AppShell";
import { cookies } from "next/headers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userCookie = cookies().get("auth_user")?.value;
  const user = userCookie ? JSON.parse(userCookie) : null;
  const displayName =
    user?.user_type === "company"
      ? user?.company_name ?? user?.login_id
      : user?.full_name ?? user?.login_id;

  return (
    <AppShell userName={displayName ?? "User"} userEmail={user?.email ?? user?.login_id ?? ""}>
      {children}
    </AppShell>
  );
}
