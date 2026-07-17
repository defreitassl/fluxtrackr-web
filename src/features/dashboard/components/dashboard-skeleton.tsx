export function DashboardSkeleton() {
  return (
    <div aria-label="Carregando Dashboard" className="dashboard-skeleton" role="status">
      <span className="skeleton-line skeleton-line-title" />
      <section className="skeleton-card skeleton-balance-card" aria-hidden="true">
        <span className="skeleton-line skeleton-line-short" />
        <span className="skeleton-line skeleton-line-value" />
        <div className="skeleton-pairs">
          <span className="skeleton-line" />
          <span className="skeleton-line" />
        </div>
      </section>
      <div className="dashboard-primary-grid" aria-hidden="true">
        <section className="skeleton-card" />
      </div>
      <div className="dashboard-secondary-grid" aria-hidden="true">
        <section className="skeleton-card" />
        <section className="skeleton-card" />
        <section className="skeleton-card" />
      </div>
      <section className="skeleton-card skeleton-list-card" aria-hidden="true" />
      <section className="skeleton-card skeleton-list-card" aria-hidden="true" />
    </div>
  );
}
