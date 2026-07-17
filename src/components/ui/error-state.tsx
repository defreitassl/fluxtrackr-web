import { CircleAlert } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Não foi possível carregar esta área",
  description = "Verifique sua conexão e tente novamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-card state-card-error" role="alert">
      <CircleAlert aria-hidden="true" size={22} />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {onRetry ? (
        <button className="secondary-button" onClick={onRetry} type="button">
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
