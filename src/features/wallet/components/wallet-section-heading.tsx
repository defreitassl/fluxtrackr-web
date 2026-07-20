import type { ReactNode } from "react";

type WalletSectionHeadingProps = {
  count: number;
  id: string;
  title: string;
  action?: ReactNode;
};

export function WalletSectionHeading({ action, count, id, title }: WalletSectionHeadingProps) {
  return (
    <div className="wallet-section-heading">
      <div>
        <p className="page-eyebrow">Leitura</p>
        <h2 id={id}>{title}</h2>
      </div>
      <div className="wallet-section-heading-meta">
        <span>
          {count} {count === 1 ? "item" : "itens"}
        </span>
        {action}
      </div>
    </div>
  );
}
