export function WalletSkeleton() {
  return (
    <div className="wallet-skeleton" aria-label="Carregando Carteira" role="status">
      <div className="skeleton-card wallet-skeleton-summary" />
      <div className="wallet-skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="wallet-skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </div>
  );
}
