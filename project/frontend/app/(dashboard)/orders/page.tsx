import { OrdersScreen } from "@/components/screens/OrdersScreen";
import { Suspense } from "react";

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-muted p-6">Đang tải đơn hàng...</p>}>
      <OrdersScreen />
    </Suspense>
  );
}
