"use client";

import type { AccountTransfer } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { AccountTransferDialog } from "@/features/wallet/transfers/components/account-transfer-dialog";
import { useCurrentWalletPeriod } from "@/features/wallet/hooks/use-current-wallet-period";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";

type TransactionTransferDialogProps = {
  initialSourceAccountId: string;
  onClose: () => void;
  onTransferred: (transfer: AccountTransfer) => void;
};

export function TransactionTransferDialog({ initialSourceAccountId, onClose, onTransferred }: TransactionTransferDialogProps) {
  const { period } = useCurrentWalletPeriod();
  const wallet = useWalletOverview(period);

  if (!wallet.data) {
    return (
      <Dialog
        description="A transferência será registrada pela API e não cria receita ou despesa."
        descriptionId="transaction-transfer-loading-description"
        onClose={onClose}
        open
        title="Transferir entre contas"
        titleId="transaction-transfer-loading-title"
      >
        {wallet.isError ? <div className="state-card state-card-error" role="alert"><strong>Não foi possível carregar as contas.</strong><button className="secondary-button" onClick={() => void wallet.refetch({ cancelRefetch: false })} type="button">Tentar novamente</button></div> : <p className="resource-refreshing" role="status">Carregando contas ativas…</p>}
      </Dialog>
    );
  }

  const sourceAccountId = wallet.data.accounts.some(({ account }) => account.id === initialSourceAccountId)
    ? initialSourceAccountId
    : wallet.data.accounts[0]?.account.id;

  if (!sourceAccountId) {
    return null;
  }

  return <AccountTransferDialog accounts={wallet.data.accounts} initialSourceAccountId={sourceAccountId} onClose={onClose} onTransferred={onTransferred} open />;
}
