import { ReceiptText } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Movimentações" };

export default function TransactionsPage() {
  return (
    <ScreenPlaceholder
      description="Registros realizados e futuros, sempre conforme dados da API."
      eyebrow="Organização"
      icon={ReceiptText}
      title="Movimentações"
    />
  );
}
