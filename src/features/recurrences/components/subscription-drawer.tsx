"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Account, Category, CreditCard, Subscription } from "@/api/generated/client";
import { useCreateSubscription, useUpdateSubscription } from "@/features/recurrences/mutations/use-recurrence-mutations";
import {
  subscriptionFormSchema,
  toCreateSubscriptionPayload,
  toSubscriptionFormValues,
  toUpdateSubscriptionPayload,
  type SubscriptionFormValues,
} from "@/features/recurrences/schemas/subscription-form-schema";
import { cn } from "@/lib/cn";
import { getRecurrenceErrorMessage } from "@/features/recurrences/lib/recurrence-error-message";

type SubscriptionDrawerProps = {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  editing: Subscription | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  open: boolean;
};

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
] as const;

export function SubscriptionDrawer({
  accounts,
  categories,
  creditCards,
  editing,
  onClose,
  onSaved,
  open,
}: SubscriptionDrawerProps) {
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const [values, setValues] = useState<SubscriptionFormValues>(() => toSubscriptionFormValues());
  const [error, setError] = useState<string | null>(null);

  const session = open ? (editing?.id ?? "new") : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setValues(toSubscriptionFormValues(editing ?? undefined));
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createMutation.isPending && !updateMutation.isPending) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [createMutation.isPending, onClose, open, updateMutation.isPending]);

  const activeAccounts = useMemo(() => accounts.filter((item) => item.isActive), [accounts]);
  const activeCards = useMemo(() => creditCards.filter((item) => item.isActive), [creditCards]);
  const expenseCategories = useMemo(
    () => categories.filter((item) => item.isActive && (item.type === "expense" || item.type === "both")),
    [categories],
  );
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const usesCard = Boolean(values.creditCardId);

  function update(patch: Partial<SubscriptionFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    setError(null);
    const parsed = subscriptionFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados da assinatura.");
      return;
    }

    try {
      if (editing) {
        const payload = toUpdateSubscriptionPayload(parsed.data, editing);
        if (Object.keys(payload).length > 0) {
          await updateMutation.mutateAsync({ id: editing.id, payload });
          onSaved("Assinatura atualizada.");
        } else {
          onSaved("Nenhuma alteração para salvar.");
        }
      } else {
        await createMutation.mutateAsync(toCreateSubscriptionPayload(parsed.data));
        onSaved("Assinatura criada.");
      }
    } catch (mutationError) {
      setError(getRecurrenceErrorMessage(mutationError));
    }
  }

  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={isSaving ? undefined : onClose} />
      <aside
        aria-hidden={!open}
        aria-label={editing ? "Editar assinatura" : "Nova assinatura"}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{editing ? "Editar assinatura" : "Nova assinatura"}</strong>
            <p>Configure a cobrança recorrente</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" disabled={isSaving} onClick={onClose} type="button"><X aria-hidden="true" size={15} /></button>
        </div>

        <div className="txx-drawer-body">
          <label className="txx-field">
            <span>Nome</span>
            <input className="txx-input" onChange={(event) => update({ name: event.target.value })} placeholder="Ex.: Streaming" value={values.name} />
          </label>

          <label className="txx-field">
            <span>Valor</span>
            <div className="txx-amount-input"><span aria-hidden="true">R$</span><input aria-label="Valor" inputMode="decimal" onChange={(event) => update({ amount: event.target.value })} placeholder="0,00" value={values.amount} /></div>
          </label>

          <div className="txx-field-row txx-field">
            <label>
              <span className="txx-field-label">Próxima cobrança</span>
              <input className="txx-input" onChange={(event) => update({ nextChargeDate: event.target.value })} type="date" value={values.nextChargeDate} />
            </label>
            <label>
              <span className="txx-field-label">Recorrência</span>
              <select className="txx-select" onChange={(event) => update({ recurrence: event.target.value as SubscriptionFormValues["recurrence"] })} value={values.recurrence}>
                <option value="monthly">Mensal</option>
                <option value="semiannual">Semestral</option>
                <option value="yearly">Anual</option>
              </select>
            </label>
          </div>

          <label className="txx-field">
            <span>Categoria</span>
            <select className="txx-select" onChange={(event) => update({ categoryId: event.target.value })} value={values.categoryId}>
              <option value="">Sem categoria</option>
              {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>

          <div className="txx-field">
            <span className="txx-field-label">Destino da cobrança</span>
            <div className="rcx-destination-tabs" role="group" aria-label="Destino da cobrança">
              <button aria-pressed={!usesCard} onClick={() => update({ creditCardId: "", paymentMethod: values.paymentMethod === "" ? "pix" : values.paymentMethod })} type="button">Conta</button>
              <button aria-pressed={usesCard} onClick={() => update({ accountId: "", creditCardId: values.creditCardId || activeCards[0]?.id || "", paymentMethod: "" })} type="button">Cartão</button>
            </div>
          </div>

          {!usesCard ? (
            <>
              <label className="txx-field">
                <span>Conta</span>
                <select className="txx-select" onChange={(event) => update({ accountId: event.target.value, creditCardId: "" })} value={values.accountId}>
                  <option value="">Escolha a conta</option>
                  {activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </label>
              <div className="txx-field">
                <span className="txx-field-label">Meio de pagamento</span>
                <div className="txx-method-chips">
                  {paymentMethods.map((method) => <button aria-pressed={values.paymentMethod === method.value} key={method.value} onClick={() => update({ paymentMethod: method.value })} type="button">{method.label}</button>)}
                </div>
              </div>
            </>
          ) : (
            <label className="txx-field">
              <span>Cartão</span>
              <select className="txx-select" onChange={(event) => update({ creditCardId: event.target.value, accountId: "", paymentMethod: "" })} value={values.creditCardId}>
                <option value="">Escolha o cartão</option>
                {activeCards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
              </select>
            </label>
          )}

          <label className="rcx-check"><input checked={values.autoRenew} onChange={(event) => update({ autoRenew: event.target.checked })} type="checkbox" /> Renovar automaticamente</label>
          <label className="rcx-check"><input checked={values.isActive} onChange={(event) => update({ isActive: event.target.checked })} type="checkbox" /> Assinatura ativa</label>

          {error ? <p className="txx-form-error" role="alert">{error}</p> : null}
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={isSaving} onClick={onClose} type="button">Cancelar</button>
          <button className="txx-drawer-save" disabled={isSaving} onClick={() => void handleSave()} type="button">{isSaving ? "Salvando…" : editing ? "Salvar alterações" : "Criar assinatura"}</button>
        </div>
      </aside>
    </>
  );
}
