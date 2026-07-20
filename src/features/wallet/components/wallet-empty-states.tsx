import { Plus, WalletCards, type LucideIcon } from "lucide-react";

export function InlineEmpty({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="wallet-inline-empty">
      <Icon aria-hidden="true" size={20} />
      <p>{message}</p>
    </div>
  );
}

export function EmptyWallet({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <section className="wallet-empty-state" aria-labelledby="wallet-empty-title">
      <span className="empty-state-icon" aria-hidden="true">
        <WalletCards size={24} />
      </span>
      <h2 id="wallet-empty-title">Sua Carteira ainda não tem itens</h2>
      <p>
        Cadastre sua primeira conta para começar a acompanhar saldos e composição financeira aqui.
      </p>
      <button className="primary-button" onClick={onCreateAccount} type="button">
        <Plus aria-hidden="true" size={16} />
        Nova conta
      </button>
    </section>
  );
}
