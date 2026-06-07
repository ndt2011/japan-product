import { OrderDetailScreen } from "@/components/screens/OrderDetailScreen";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailScreen orderId={Number(params.id)} />;
}
