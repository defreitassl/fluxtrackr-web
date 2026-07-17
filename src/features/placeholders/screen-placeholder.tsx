import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type ScreenPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ScreenPlaceholder({ eyebrow, title, description, icon }: ScreenPlaceholderProps) {
  return (
    <div className="screen-placeholder">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="placeholder-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <EmptyState
        description="Esta área está pronta para receber dados consolidados pela API do FluxTrackr."
        icon={icon}
        title="Próximo recorte em preparação"
      />
    </div>
  );
}
