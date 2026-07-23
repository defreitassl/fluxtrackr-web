"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Account, Category, FinancialEvent } from "@/api/generated/client";
import { useCreditCards } from "@/features/dashboard/queries/use-credit-cards";
import { getEventErrorMessage } from "@/features/events/lib/event-error-message";
import {
  useCreateFinancialEvent,
  useUpdateFinancialEvent,
} from "@/features/events/mutations/use-financial-event-mutations";
import {
  defaultEventFormValues,
  eventFormSchema,
  toCreateEventPayload,
  toEventFormValues,
  toUpdateEventPayload,
  type EventFormValues,
} from "@/features/events/schemas/event-form-schema";
import { compatibleCategories, paymentMethodOptions } from "@/features/transactions/lib/transaction-form";
import { cn } from "@/lib/cn";

type EventTarget = "account" | "card";

type EventDrawerProps = {
  open: boolean;
  editing: FinancialEvent | null;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

const recurrenceOptions = [
  { value: "once", label: "Único" },
  { value: "monthly", label: "Mensal" },
  { value: "semiannual", label: "Semestral" },
  { value: "yearly", label: "Anual" },
] as const;

/** A API proíbe `credit` como método de eventos em conta. */
const accountPaymentMethodOptions = paymentMethodOptions.filter(
  (option) => option.value !== "credit",
);

export function EventDrawer({ open, editing, categories, accounts, onClose, onSaved }: EventDrawerProps) {
  const [values, setValues] = useState<EventFormValues>(() => defaultEventFormValues());
  const [target, setTarget] = useState<EventTarget>("account");
  const [error, setError] = useState<string | null>(null);

  const { data: creditCards } = useCreditCards({ enabled: open });
  const activeAccounts = useMemo(() => accounts.filter((account) => account.isActive), [accounts]);
  const activeCards = useMemo(
    () => (creditCards ?? []).filter((creditCard) => creditCard.isActive !== false),
    [creditCards],
  );

  // Reinicia o formulário sempre que o drawer abre (ajuste de estado no render).
  const session = open ? (editing?.id ?? "new") : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      if (editing) {
        setValues(toEventFormValues(editing));
        setTarget(editing.creditCardId ? "card" : "account");
      } else {
        setValues(defaultEventFormValues());
        setTarget("account");
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

  const createMutation = useCreateFinancialEvent();
  const updateMutation = useUpdateFinancialEvent();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isExpense = values.type === "expense";
  const isCardTarget = isExpense && target === "card";
  const availableCategories = compatibleCategories(categories, values.type);

  function setType(type: "expense" | "income") {
    setError(null);
    setTarget((current) => (type === "income" ? "account" : current));
    setValues((current) => ({
      ...current,
      type,
      ...(type === "income" ? { creditCardId: "", installmentCount: "1" } : {}),
    }));
  }

  function setDestination(next: EventTarget) {
    setError(null);
    setTarget(next);
    setValues((current) =>
      next === "card"
        ? { ...current, accountId: "", paymentMethod: "" }
        : { ...current, creditCardId: "", installmentCount: "1" },
    );
  }

  function save() {
    setError(null);
    const parsed = eventFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados do evento.");
      return;
    }

    if (editing) {
      const payload = toUpdateEventPayload(parsed.data, editing);
      if (Object.keys(payload).length === 0) {
        onSaved("Evento atualizado.");
        return;
      }
      updateMutation.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => onSaved("Evento atualizado."),
          onError: (mutationError) => setError(getEventErrorMessage(mutationError, "save")),
        },
      );
      return;
    }

    createMutation.mutate(toCreateEventPayload(parsed.data), {
      onSuccess: () => onSaved("Evento criado."),
      onError: (mutationError) => setError(getEventErrorMessage(mutationError, "save")),
    });
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("txx-backdrop", open && "txx-backdrop-open")}
        onClick={onClose}
      />
      <aside
        aria-hidden={!open}
        aria-label={editing ? "Editar evento" : "Novo evento"}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{editing ? "Editar evento" : "Novo evento"}</strong>
            <p>Compromisso futuro previsto — sem movimentar o saldo agora</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          <div className="txx-type-tabs" role="group" aria-label="Tipo de evento">
            <button
              aria-pressed={values.type === "expense"}
              className="txx-type-expense"
              onClick={() => setType("expense")}
              type="button"
            >
              Despesa
            </button>
            <button
              aria-pressed={values.type === "income"}
              className="txx-type-income"
              onClick={() => setType("income")}
              type="button"
            >
              Receita
            </button>
          </div>

          <label className="txx-field">
            <span>Nome do evento</span>
            <input
              className="txx-input"
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder={isExpense ? "Ex.: IPVA 2026" : "Ex.: Salário"}
              value={values.name}
            />
          </label>

          <label className="txx-field">
            <span>Valor previsto</span>
            <div className="txx-amount-input">
              <span aria-hidden="true">R$</span>
              <input
                aria-label="Valor previsto"
                inputMode="decimal"
                onChange={(event) =>
                  setValues((current) => ({ ...current, expectedAmount: event.target.value }))
                }
                placeholder="0,00"
                value={values.expectedAmount}
              />
            </div>
          </label>

          <div className="txx-field-row txx-field">
            <label>
              <span className="txx-field-label">Data prevista</span>
              <input
                aria-label="Data prevista"
                className="txx-input"
                onChange={(event) => setValues((current) => ({ ...current, date: event.target.value }))}
                type="datetime-local"
                value={values.date}
              />
            </label>
            <label>
              <span className="txx-field-label">Recorrência</span>
              <select
                aria-label="Recorrência"
                className="txx-select"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    recurrence: event.target.value as EventFormValues["recurrence"],
                  }))
                }
                value={values.recurrence}
              >
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isExpense ? (
            <div className="txx-field">
              <span className="txx-field-label">Pagar com</span>
              <div className="txx-method-chips">
                <button
                  aria-pressed={target === "account"}
                  onClick={() => setDestination("account")}
                  type="button"
                >
                  Conta
                </button>
                <button
                  aria-pressed={target === "card"}
                  onClick={() => setDestination("card")}
                  type="button"
                >
                  Cartão de crédito
                </button>
              </div>
            </div>
          ) : null}

          {isCardTarget ? (
            <div className="txx-field-row txx-field">
              <label>
                <span className="txx-field-label">Cartão</span>
                <select
                  aria-label="Cartão"
                  className="txx-select"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, creditCardId: event.target.value }))
                  }
                  value={values.creditCardId}
                >
                  <option value="">Escolha o cartão</option>
                  {activeCards.map((creditCard) => (
                    <option key={creditCard.id} value={creditCard.id}>
                      {creditCard.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="txx-field-label">Parcelas</span>
                <input
                  aria-label="Parcelas"
                  className="txx-input"
                  inputMode="numeric"
                  max={120}
                  min={1}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, installmentCount: event.target.value }))
                  }
                  type="number"
                  value={values.installmentCount}
                />
              </label>
            </div>
          ) : (
            <label className="txx-field">
              <span>Conta</span>
              <select
                aria-label="Conta"
                className="txx-select"
                onChange={(event) =>
                  setValues((current) => ({ ...current, accountId: event.target.value }))
                }
                value={values.accountId}
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

          {!isCardTarget ? (
            <div className="txx-field">
              <span className="txx-field-label">Método de pagamento</span>
              <div className="txx-method-chips">
                {accountPaymentMethodOptions.map((option) => (
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
              <p className="evx-field-hint">
                Necessário para realizar o evento — a transação criada usa este método.
              </p>
            </div>
          ) : null}

          <label className="txx-field">
            <span>Observações</span>
            <textarea
              className="txx-input"
              onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Opcional"
              rows={2}
              value={values.notes}
            />
          </label>

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
            {isSaving ? "Salvando…" : "Salvar evento"}
          </button>
        </div>
      </aside>
    </>
  );
}
