import { InvoiceDetailScreen } from "@/components/screens/InvoiceDetailScreen";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return <InvoiceDetailScreen invoiceId={Number(params.id)} />;
}
