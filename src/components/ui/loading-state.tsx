export function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="state-card" role="status">
      <span className="state-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
