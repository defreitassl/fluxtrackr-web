import { RefreshCw } from "lucide-react";

type WalletHeaderProps = {
  isRefreshing: boolean;
  isInitialLoading: boolean;
  onRefresh: () => void;
};

export function WalletHeader({ isRefreshing, isInitialLoading, onRefresh }: WalletHeaderProps) {
  return (
    <header className="wallet-page-header">
      <div>
        <p className="page-eyebrow">Organização</p>
        <h1 id="wallet-title">Carteira</h1>
        <p>Contas, cartões e faturas atuais, sempre apresentados a partir dos retornos da API.</p>
      </div>
      <button
        aria-label="Atualizar Carteira"
        className="secondary-button wallet-refresh-button"
        disabled={isRefreshing}
        onClick={onRefresh}
        type="button"
      >
        <RefreshCw aria-hidden="true" className={isRefreshing ? "is-spinning" : undefined} size={16} />
        {isRefreshing && !isInitialLoading ? "Atualizando…" : "Atualizar"}
      </button>
    </header>
  );
}
