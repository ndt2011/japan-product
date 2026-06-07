import { ProductDetailScreen } from "@/components/screens/ProductDetailScreen";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return <ProductDetailScreen productId={Number(params.id)} />;
}
