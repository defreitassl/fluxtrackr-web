import { ListTree } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Timeline" };

export default function TimelinePage() {
  return (
    <ScreenPlaceholder
      description="Compromissos e movimentos financeiros em sequência cronológica."
      eyebrow="Planejamento"
      icon={ListTree}
      title="Timeline"
    />
  );
}
