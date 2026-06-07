import { ShipmentDetailScreen } from "@/components/screens/ShipmentDetailScreen";

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  return <ShipmentDetailScreen batchId={Number(params.id)} />;
}
