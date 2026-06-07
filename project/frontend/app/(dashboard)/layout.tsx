import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { RouteGuard } from "@/components/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>
        <RouteGuard>{children}</RouteGuard>
      </AppShell>
    </AuthProvider>
  );
}
