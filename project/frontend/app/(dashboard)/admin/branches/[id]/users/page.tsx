import { BranchUsersScreen } from "@/components/screens/BranchUsersScreen";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchUsersPage({ params }: Props) {
  const { id } = await params;
  return <BranchUsersScreen branchId={Number(id)} />;
}
