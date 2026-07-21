"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { Transaction } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { deleteTransactionData } from "@/features/transactions/api/transactions";
import { getTransactionErrorMessage } from "@/features/transactions/lib/transaction-form";

type DeleteTransactionsDialogProps = {
  open: boolean;
  transactions: Transaction[];
  onClose: () => void;
  onDone: (message: string) => void;
};

export function DeleteTransactionsDialog({
  open,
  transactions,
  onClose,
  onDone,
}: DeleteTransactionsDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all(transactions.map((transaction) => deleteTransactionData(transaction.id)));
    },
    onSuccess: async () => {
      await Promise.all(
        [
          ["transactions"],
          ["monthly-summary"],
          ["wallet-overview"],
          ["dashboard-overview"],
          ["financial-timeline"],
          ["balance-forecast"],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
      onDone(
        transactions.length === 1
          ? "Movimentação excluída."
          : `${transactions.length} movimentações excluídas.`,
      );
    },
    onError: (mutationError) => setError(getTransactionErrorMessage(mutationError, "delete")),
  });

  const summary =
    transactions.length === 1
      ? `Excluir "${transactions[0]?.description}"? Essa ação não pode ser desfeita.`
      : `Excluir ${transactions.length} movimentações selecionadas? Essa ação não pode ser desfeita.`;

  return (
    <Dialog
      description={summary}
      descriptionId="delete-transactions-description"
      busy={mutation.isPending}
      onClose={onClose}
      open={open}
      title="Excluir movimentações"
      titleId="delete-transactions-title"
    >
      {error ? (
        <p className="txx-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="txx-drawer-foot" style={{ padding: "16px 0 0", borderTop: 0 }}>
        <button className="txx-drawer-cancel" disabled={mutation.isPending} onClick={onClose} type="button">
          Cancelar
        </button>
        <button
          className="txx-drawer-save"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
          type="button"
        >
          {mutation.isPending ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </Dialog>
  );
}
