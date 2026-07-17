import { LayoutDashboard } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <ScreenPlaceholder
      description="Sua visão consolidada de saldo, compromissos, previsão e orçamento."
      eyebrow="Visão geral"
      icon={LayoutDashboard}
      title="Dashboard"
    />
  );
}
