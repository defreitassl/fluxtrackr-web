export function TimelineSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando Timeline" className="tlx-skeleton" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="tlx-skeleton-row" key={index}>
          <i aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
