"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { Category, Transaction } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { updateTransactionData } from "@/features/transactions/api/transactions";
import { getTransactionErrorMessage } from "@/features/transactions/lib/transaction-form";

type RecategorizeDialogProps = {
  open: boolean;
  transactions: Transaction[];
  categories: Category[];
  onClose: () => void;
  onDone: (message: string) => void;
};

export function RecategorizeDialog({
  open,
  transactions,
  categories,
  onClose,
  onDone,
}: RecategorizeDialogProps) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        transactions.map((transaction) =>
          updateTransactionData(transaction.id, { categoryId: categoryId || null }),
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
      ]);
      onDone(
        transactions.length === 1
          ? "1 movimentação recategorizada."
          : `${transactions.length} movimentações recategorizadas.`,
      );
    },
    onError: (mutationError) => setError(getTransactionErrorMessage(mutationError)),
  });

  return (
    <Dialog
      description="A categoria escolhida será aplicada a todas as movimentações selecionadas."
      descriptionId="recategorize-description"
      busy={mutation.isPending}
      onClose={onClose}
      open={open}
      title="Recategorizar movimentações"
      titleId="recategorize-title"
    >
      <div className="txx-field">
        <span className="txx-field-label">Nova categoria</span>
        <select
          aria-label="Nova categoria"
          className="txx-select"
          onChange={(event) => {
            setCategoryId(event.target.value);
            setError(null);
          }}
          value={categoryId}
        >
          <option value="">Sem categoria</option>
          {categories
            .filter((category) => category.isActive)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>
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
          type="button"
        >
          {mutation.isPending ? "Aplicando…" : "Aplicar categoria"}
        </button>
      </div>
    </Dialog>
  );
}
