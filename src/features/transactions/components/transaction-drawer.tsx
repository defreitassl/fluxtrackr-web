"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Account, Category, PaymentMethod, Transaction } from "@/api/generated/client";
import { useCreditCards } from "@/features/dashboard/queries/use-credit-cards";
import {
  createFixedExpenseData,
  createFixedIncomeData,
  createTransactionData,
  updateTransactionData,
} from "@/features/transactions/api/transactions";
import {
  compatibleCategories,
  getTransactionErrorMessage,
  isoToDateTimeLocal,
  nowDateTimeLocal,
  paymentMethodOptions,
  toCreateTransactionPayload,
  toUpdateTransactionPayload,
  transactionFormSchema,
  type TransactionFormValues,
} from "@/features/transactions/lib/transaction-form";
import { useCreateCreditCardPurchase } from "@/features/wallet/credit-cards/mutations/use-create-credit-card-purchase";
import { useCreateAccountTransfer } from "@/features/wallet/transfers/mutations/use-create-account-transfer";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/http";
import { normalizeDecimalInput, parseFiniteMoneyNumber } from "@/lib/money-input";

export type DrawerTab = "expense" | "income" | "transfer" | "card";

type TransactionDrawerProps = {
  open: boolean;
  editing: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

const tabLabels: Record<DrawerTab, { label: string; className: string }> = {
  expense: { label: "Despesa", className: "txx-type-expense" },
  income: { label: "Receita", className: "txx-type-income" },
  transfer: { label: "Transferência", className: "txx-type-transfer" },
  card: { label: "Compra no cartão", className: "txx-type-card" },
};

const invalidatedKeys = [
  ["transactions"],
  ["monthly-summary"],
  ["wallet-overview"],
  ["dashboard-overview"],
  ["financial-timeline"],
  ["balance-forecast"],
  ["fixed-expenses"],
  ["fixed-incomes"],
];

function emptyTransactionValues(type: "expense" | "income"): TransactionFormValues {
  return { type, amount: "", description: "", occurredAt: nowDateTimeLocal(), categoryId: "", accountId: "", paymentMethod: "" };
}

export function TransactionDrawer({
  open,
  editing,
  categories,
  accounts,
  onClose,
  onSaved,
}: TransactionDrawerProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DrawerTab>("expense");
  const [values, setValues] = useState<TransactionFormValues>(() => emptyTransactionValues("expense"));
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [transfer, setTransfer] = useState({ sourceAccountId: "", destinationAccountId: "" });
  const [card, setCard] = useState({ creditCardId: "", installmentCount: "1" });
  const [error, setError] = useState<string | null>(null);

  const { data: creditCards } = useCreditCards({ enabled: open });
  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);
  const activeCards = useMemo(
    () => (creditCards ?? []).filter((creditCard) => creditCard.isActive !== false),
    [creditCards],
  );

  // Reinicia o formulário sempre que o drawer abre (padrão React de ajuste
  // de estado durante o render, em vez de efeito).
  const session = open ? (editing?.id ?? "new") : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      setRepeatMonthly(false);
      setTransfer({ sourceAccountId: "", destinationAccountId: "" });
      setCard({ creditCardId: "", installmentCount: "1" });
      if (editing) {
        setTab(editing.type === "income" ? "income" : "expense");
        setValues({
          type: editing.type,
          amount: editing.amount,
          description: editing.description,
          occurredAt: isoToDateTimeLocal(editing.occurredAt),
          categoryId: editing.categoryId ?? "",
          accountId: editing.accountId ?? "",
          paymentMethod: editing.paymentMethod ?? "",
        });
      } else {
        setTab("expense");
        setValues(emptyTransactionValues("expense"));
      }
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const transferMutation = useCreateAccountTransfer();
  const purchaseMutation = useCreateCreditCardPurchase();
  const transactionMutation = useMutation({
    mutationFn: async () => {
      const parsed = transactionFormSchema.safeParse(values);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Verifique os dados do lançamento.");
      }
      if (editing) {
        const payload = toUpdateTransactionPayload(parsed.data, editing);
        if (Object.keys(payload).length > 0) {
          await updateTransactionData(editing.id, payload);
        }
        return "Movimentação atualizada.";
      }

      await createTransactionData(toCreateTransactionPayload(parsed.data));
      if (repeatMonthly) {
        const base = {
          name: parsed.data.description.trim(),
          amount: parseFiniteMoneyNumber(parsed.data.amount),
          ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}),
          ...(parsed.data.accountId ? { accountId: parsed.data.accountId } : {}),
          ...(parsed.data.paymentMethod ? { paymentMethod: parsed.data.paymentMethod as PaymentMethod } : {}),
        };
        const day = new Date(parsed.data.occurredAt).getDate();
        if (parsed.data.type === "expense") {
          await createFixedExpenseData({ ...base, dueDay: day });
        } else {
          await createFixedIncomeData({ ...base, receiveDay: day });
        }
        return "Movimentação registrada e recorrência mensal criada.";
      }
      return "Movimentação registrada.";
    },
    onSuccess: async (message) => {
      await Promise.all(
        invalidatedKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
      onSaved(message);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof ApiError
          ? getTransactionErrorMessage(mutationError)
          : mutationError.message,
      );
    },
  });

  const isSaving = transactionMutation.isPending || transferMutation.isPending || purchaseMutation.isPending;

  function save() {
    setError(null);
    if (tab === "expense" || tab === "income") {
      transactionMutation.mutate();
      return;
    }
    if (tab === "transfer") {
      const amount = parseFiniteMoneyNumber(normalizeDecimalInput(values.amount));
      if (!(amount > 0)) return setError("Informe um valor maior que zero.");
      if (!transfer.sourceAccountId || !transfer.destinationAccountId) {
        return setError("Escolha as contas de origem e destino.");
      }
      if (transfer.sourceAccountId === transfer.destinationAccountId) {
        return setError("As contas de origem e destino precisam ser diferentes.");
      }
      transferMutation.mutate(
        {
          sourceAccountId: transfer.sourceAccountId,
          destinationAccountId: transfer.destinationAccountId,
          amount: normalizeDecimalInput(values.amount),
          ...(values.description.trim() ? { description: values.description.trim() } : {}),
        },
        {
          onSuccess: () => onSaved("Transferência registrada."),
          onError: (mutationError) => setError(getTransactionErrorMessage(mutationError)),
        },
      );
      return;
    }

    const amount = parseFiniteMoneyNumber(normalizeDecimalInput(values.amount));
    const installments = Number(card.installmentCount);
    if (!(amount > 0)) return setError("Informe um valor maior que zero.");
    if (!values.description.trim()) return setError("Informe uma descrição.");
    if (!card.creditCardId) return setError("Escolha o cartão da compra.");
    if (!Number.isInteger(installments) || installments < 1 || installments > 120) {
      return setError("Informe um número de parcelas entre 1 e 120.");
    }
    purchaseMutation.mutate(
      {
        creditCardId: card.creditCardId,
        description: values.description.trim(),
        totalAmount: amount,
        purchaseDate: new Date(values.occurredAt).toISOString(),
        installmentCount: installments,
        ...(values.categoryId ? { categoryId: values.categoryId } : {}),
      },
      {
        onSuccess: () => onSaved("Compra no cartão registrada."),
        onError: (mutationError) => setError(getTransactionErrorMessage(mutationError)),
      },
    );
  }

  const isTransactionTab = tab === "expense" || tab === "income";
  const categoryType = tab === "income" ? "income" : "expense";
  const availableCategories = compatibleCategories(categories, categoryType);

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("txx-backdrop", open && "txx-backdrop-open")}
        onClick={onClose}
      />
      <aside
        aria-hidden={!open}
        aria-label={editing ? "Editar movimentação" : "Nova movimentação"}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{editing ? "Editar movimentação" : "Nova movimentação"}</strong>
            <p>Preencha os dados do lançamento</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          <div className="txx-type-tabs" role="group" aria-label="Tipo de movimentação">
            {(Object.keys(tabLabels) as DrawerTab[]).map((key) => {
              const disabled = Boolean(editing) && key !== "expense" && key !== "income";
              return (
                <button
                  aria-pressed={tab === key}
                  className={tabLabels[key].className}
                  disabled={disabled}
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setError(null);
                    if (key === "expense" || key === "income") {
                      setValues((current) => ({ ...current, type: key }));
                    }
                  }}
                  type="button"
                >
                  {tabLabels[key].label}
                </button>
              );
            })}
          </div>

          <label className="txx-field">
            <span>Valor</span>
            <div className="txx-amount-input">
              <span aria-hidden="true">R$</span>
              <input
                aria-label="Valor"
                inputMode="decimal"
                onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0,00"
                value={values.amount}
              />
            </div>
          </label>

          <label className="txx-field">
            <span>Descrição</span>
            <input
              className="txx-input"
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              placeholder={tab === "transfer" ? "Transferência entre contas" : "Ex.: Supermercado"}
              value={values.description}
            />
          </label>

          <div className="txx-field-row txx-field">
            <label>
              <span className="txx-field-label">
                Data
              </span>
              <input
                aria-label="Data"
                className="txx-input"
                onChange={(event) =>
                  setValues((current) => ({ ...current, occurredAt: event.target.value }))
                }
                type="datetime-local"
                value={values.occurredAt}
              />
            </label>
            {isTransactionTab ? (
              <label>
                <span className="txx-field-label">
                  Conta
                </span>
                <select
                  aria-label="Conta"
                  className="txx-select"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, accountId: event.target.value }))
                  }
                  value={values.accountId}
                >
                  <option value="">Sem conta</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : tab === "card" ? (
              <label>
                <span className="txx-field-label">
                  Cartão
                </span>
                <select
                  aria-label="Cartão"
                  className="txx-select"
                  onChange={(event) => setCard((current) => ({ ...current, creditCardId: event.target.value }))}
                  value={card.creditCardId}
                >
                  <option value="">Escolha o cartão</option>
                  {activeCards.map((creditCard) => (
                    <option key={creditCard.id} value={creditCard.id}>
                      {creditCard.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                <span className="txx-field-label">
                  Conta de origem
                </span>
                <select
                  aria-label="Conta de origem"
                  className="txx-select"
                  onChange={(event) =>
                    setTransfer((current) => ({ ...current, sourceAccountId: event.target.value }))
                  }
                  value={transfer.sourceAccountId}
                >
                  <option value="">Escolha a conta</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {tab === "transfer" ? (
            <label className="txx-field">
              <span>Conta de destino</span>
              <select
                aria-label="Conta de destino"
                className="txx-select"
                onChange={(event) =>
                  setTransfer((current) => ({ ...current, destinationAccountId: event.target.value }))
                }
                value={transfer.destinationAccountId}
              >
                <option value="">Escolha a conta</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="txx-field">
              <span>Categoria</span>
              <select
                aria-label="Categoria"
                className="txx-select"
                onChange={(event) =>
                  setValues((current) => ({ ...current, categoryId: event.target.value }))
                }
                value={values.categoryId}
              >
                <option value="">Sem categoria</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {tab === "card" ? (
            <label className="txx-field">
              <span>Parcelas</span>
              <input
                aria-label="Parcelas"
                className="txx-input"
                inputMode="numeric"
                max={120}
                min={1}
                onChange={(event) =>
                  setCard((current) => ({ ...current, installmentCount: event.target.value }))
                }
                type="number"
                value={card.installmentCount}
              />
            </label>
          ) : null}

          {isTransactionTab ? (
            <div className="txx-field">
              <span className="txx-field-label">
                Método de pagamento
              </span>
              <div className="txx-method-chips">
                {paymentMethodOptions.map((option) => (
                  <button
                    aria-pressed={values.paymentMethod === option.value}
                    key={option.value}
                    onClick={() =>
                      setValues((current) => ({
                        ...current,
                        paymentMethod: current.paymentMethod === option.value ? "" : option.value,
                      }))
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isTransactionTab && !editing ? (
            <div className="txx-recurring">
              <div>
                <strong>Repetir mensalmente</strong>
                <span>
                  {tab === "expense" ? "Cria um gasto fixo recorrente" : "Cria uma receita fixa recorrente"}
                </span>
              </div>
              <button
                aria-checked={repeatMonthly}
                aria-label="Repetir mensalmente"
                className="tlx-switch"
                onClick={() => setRepeatMonthly((value) => !value)}
                role="switch"
                type="button"
              >
                <i aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="txx-form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={isSaving} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="txx-drawer-save" disabled={isSaving} onClick={save} type="button">
            {isSaving ? "Salvando…" : "Salvar movimentação"}
          </button>
        </div>
      </aside>
    </>
  );
}
