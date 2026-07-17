import { Settings2 } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <ScreenPlaceholder
      description="Preferências de uso e configurações da sua experiência no FluxTrackr."
      eyebrow="Conta"
      icon={Settings2}
      title="Configurações"
    />
  );
}
