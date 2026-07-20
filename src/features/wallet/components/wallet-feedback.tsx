export type RefetchErrorKind = "none" | "all" | "dashboard-only";

type WalletFeedbackProps = {
  isRefreshing: boolean;
  refetchErrorKind: RefetchErrorKind;
  onRetry: () => void;
};

const ALERT_MESSAGES: Record<Exclude<RefetchErrorKind, "none">, string> = {
  all: "Não foi possível atualizar todos os dados. Algumas informações podem estar desatualizadas.",
  "dashboard-only":
    "As contas e cartões foram atualizados, mas o panorama financeiro pode estar desatualizado.",
};

/**
 * Comunica atualização em andamento e falhas parciais de forma coordenada:
 * um único alerta cobre erro na Carteira, no Dashboard ou em ambos.
 */
export function WalletFeedback({ isRefreshing, refetchErrorKind, onRetry }: WalletFeedbackProps) {
  if (refetchErrorKind !== "none") {
    return (
      <div className="wallet-refetch-alert" role="alert">
        <span>{ALERT_MESSAGES[refetchErrorKind]}</span>
        <button className="secondary-button" onClick={onRetry} type="button">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <p className="wallet-refreshing" role="status">
        Atualizando informações da Carteira…
      </p>
    );
  }

  return null;
}
