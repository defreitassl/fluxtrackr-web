"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/cn";

type SettingsDrawerProps = React.PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  footer?: React.ReactNode;
}>;

/** Drawer lateral padrão da aplicação, reutilizado pelas telas de detalhe. */
export function SettingsDrawer({ open, title, subtitle, onClose, footer, children }: SettingsDrawerProps) {
  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={onClose} />
      <aside
        aria-hidden={!open}
        aria-label={title}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{title}</strong>
            <p>{subtitle}</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>
        <div className="txx-drawer-body">{children}</div>
        {footer ? <div className="txx-drawer-foot">{footer}</div> : null}
      </aside>
    </>
  );
}
