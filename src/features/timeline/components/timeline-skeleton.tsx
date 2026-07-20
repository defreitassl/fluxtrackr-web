export function TimelineSkeleton() {
  return (
    <div aria-label="Carregando Timeline" className="timeline-skeleton" role="status">
      <span className="skeleton-line skeleton-line-title" />
      <section className="timeline-skeleton-toolbar" aria-hidden="true">
        <span className="skeleton-line skeleton-line-short" />
        <span className="skeleton-line skeleton-line-short" />
      </section>
      <div className="timeline-skeleton-summary" aria-hidden="true">
        <span className="skeleton-card" />
        <span className="skeleton-card" />
        <span className="skeleton-card" />
        <span className="skeleton-card" />
      </div>
      <section className="skeleton-card timeline-skeleton-list" aria-hidden="true" />
    </div>
  );
}
