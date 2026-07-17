import { ChartNoAxesCombined } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Planejamento" };

export default function PlanningPage() {
  return (
    <ScreenPlaceholder
      description="Assinaturas, orçamentos e metas em uma visão de planejamento."
      eyebrow="Planejamento"
      icon={ChartNoAxesCombined}
      title="Planejamento"
    />
  );
}
