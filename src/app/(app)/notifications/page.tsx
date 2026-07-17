import { Bell } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Notificações" };

export default function NotificationsPage() {
  return (
    <ScreenPlaceholder
      description="Alertas e atividades persistidos pela API, organizados em uma central."
      eyebrow="Conta"
      icon={Bell}
      title="Notificações"
    />
  );
}
