import { FolderTree } from "lucide-react";

import { ScreenPlaceholder } from "@/features/placeholders/screen-placeholder";

export const metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <ScreenPlaceholder
      description="Estruture classificação financeira sem perder seu histórico."
      eyebrow="Organização"
      icon={FolderTree}
      title="Categorias"
    />
  );
}
