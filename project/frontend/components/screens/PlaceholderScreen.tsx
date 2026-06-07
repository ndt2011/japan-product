import { ComingSoonPanel } from "@/components/ui";

export function PlaceholderScreen({
  title,
  description,
  docRef,
}: {
  title: string;
  description: string;
  docRef?: string;
}) {
  return (
    <ComingSoonPanel
      title={title}
      description={description}
      docRef={docRef}
    />
  );
}
