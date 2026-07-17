import { Landmark } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Carteira" };

export default function WalletPage() {
  return (
    <ScreenPlaceholder
      description="Contas, cartões e bases financeiras da sua carteira."
      eyebrow="Organização"
      icon={Landmark}
      title="Carteira"
    />
  );
}
