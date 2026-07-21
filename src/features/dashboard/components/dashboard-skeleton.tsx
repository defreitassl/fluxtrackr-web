export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando Dashboard" className="dx-skeleton" role="status">
      <div className="dx-layout">
        <div className="dx-column">
          <div className="skeleton-card dx-skeleton-hero" />
          <div className="dx-skeleton-kpis">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
          <div className="skeleton-card dx-skeleton-panel" />
          <div className="skeleton-card dx-skeleton-panel" />
        </div>
        <div className="dx-side">
          <div className="skeleton-card dx-skeleton-panel" />
          <div className="skeleton-card dx-skeleton-panel" />
        </div>
      </div>
    </div>
  );
}
