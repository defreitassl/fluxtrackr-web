"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Account, Category } from "@/api/generated/client";
import { getRecurrenceErrorMessage } from "@/features/recurrences/lib/recurrence-error-message";
import {
  useCreateFixedExpense,
  useCreateFixedIncome,
  useUpdateFixedExpense,
  useUpdateFixedIncome,
} from "@/features/recurrences/mutations/use-recurrence-mutations";
import {
  fixedFormSchema,
  toCreateFixedPayload,
  toFixedFormValues,
  toUpdateFixedPayload,
  type FixedFormValues,
  type FixedKind,
  type FixedTemplate,
} from "@/features/recurrences/schemas/fixed-form-schema";
import { cn } from "@/lib/cn";

type FixedDrawerProps = {
  accounts: Account[];
  categories: Category[];
  editing: FixedTemplate | null;
  kind: FixedKind;
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

export function FixedDrawer({ accounts, categories, editing, kind, onClose, onSaved, open }: FixedDrawerProps) {
  const createExpense = useCreateFixedExpense();
  const createIncome = useCreateFixedIncome();
  const updateExpense = useUpdateFixedExpense();
  const updateIncome = useUpdateFixedIncome();
  const [values, setValues] = useState<FixedFormValues>(() => toFixedFormValues(kind));
  const [error, setError] = useState<string | null>(null);
  const session = open ? `${kind}:${editing?.id ?? "new"}` : null;
  const [lastSession, setLastSession] = useState<string | null>(null);

  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setValues(toFixedFormValues(kind, editing ?? undefined));
      setError(null);
    }
  }

  const isSaving = createExpense.isPending || createIncome.isPending || updateExpense.isPending || updateIncome.isPending;
  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isSaving, onClose, open]);

  const activeAccounts = useMemo(() => accounts.filter((item) => item.isActive), [accounts]);
  const compatibleCategories = useMemo(
    () => categories.filter((item) => item.isActive && (item.type === kind || item.type === "both")),
    [categories, kind],
  );
  const kindLabel = kind === "expense" ? "gasto fixo" : "renda fixa";
  const dayLabel = kind === "expense" ? "Dia de vencimento" : "Dia de recebimento";

  function update(patch: Partial<FixedFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    setError(null);
    const parsed = fixedFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique os dados da recorrência.");
      return;
    }

    try {
      if (editing) {
        if (kind === "expense") {
          await updateExpense.mutateAsync({ id: editing.id, payload: toUpdateFixedPayload("expense", parsed.data) });
        } else {
          await updateIncome.mutateAsync({ id: editing.id, payload: toUpdateFixedPayload("income", parsed.data) });
        }
        onSaved(`${kind === "expense" ? "Gasto" : "Renda"} fixa atualizado(a).`);
      } else if (kind === "expense") {
        await createExpense.mutateAsync(toCreateFixedPayload("expense", parsed.data));
        onSaved("Gasto fixo criado.");
      } else {
        await createIncome.mutateAsync(toCreateFixedPayload("income", parsed.data));
        onSaved("Renda fixa criada.");
      }
    } catch (mutationError) {
      setError(getRecurrenceErrorMessage(mutationError));
    }
  }

  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={isSaving ? undefined : onClose} />
      <aside aria-hidden={!open} aria-label={editing ? `Editar ${kindLabel}` : `Novo ${kindLabel}`} className={cn("txx-drawer", open && "txx-drawer-open")} role="dialog">
        <div className="txx-drawer-head">
          <div><strong>{editing ? `Editar ${kindLabel}` : `Novo ${kindLabel}`}</strong><p>Configure a recorrência mensal</p></div>
          <button aria-label="Fechar" className="txx-drawer-close" disabled={isSaving} onClick={onClose} type="button"><X aria-hidden="true" size={15} /></button>
        </div>

        <div className="txx-drawer-body">
          <label className="txx-field"><span>Nome</span><input className="txx-input" onChange={(event) => update({ name: event.target.value })} placeholder={kind === "expense" ? "Ex.: Internet" : "Ex.: Salário"} value={values.name} /></label>
          <label className="txx-field"><span>Valor mensal</span><div className="txx-amount-input"><span aria-hidden="true">R$</span><input aria-label="Valor mensal" inputMode="decimal" onChange={(event) => update({ amount: event.target.value })} placeholder="0,00" value={values.amount} /></div></label>
          <label className="txx-field"><span>{dayLabel}</span><input className="txx-input" inputMode="numeric" max="31" min="1" onChange={(event) => update({ day: event.target.value })} placeholder="Opcional — 1 a 31" type="number" value={values.day} /></label>
          <label className="txx-field"><span>Categoria</span><select className="txx-select" onChange={(event) => update({ categoryId: event.target.value })} value={values.categoryId}><option value="">Sem categoria</option>{compatibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="txx-field"><span>Conta padrão</span><select className="txx-select" onChange={(event) => update({ accountId: event.target.value })} value={values.accountId}><option value="">Definir ao realizar</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <div className="txx-field"><span className="txx-field-label">Meio de pagamento padrão</span><div className="txx-method-chips"><button aria-pressed={values.paymentMethod === ""} onClick={() => update({ paymentMethod: "" })} type="button">Definir depois</button>{paymentMethods.map((method) => <button aria-pressed={values.paymentMethod === method.value} key={method.value} onClick={() => update({ paymentMethod: method.value })} type="button">{method.label}</button>)}</div></div>
          <label className="rcx-check"><input checked={values.isActive} onChange={(event) => update({ isActive: event.target.checked })} type="checkbox" /> {kind === "expense" ? "Gasto" : "Renda"} ativo(a)</label>
          {error ? <p className="txx-form-error" role="alert">{error}</p> : null}
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={isSaving} onClick={onClose} type="button">Cancelar</button>
          <button className="txx-drawer-save" disabled={isSaving} onClick={() => void handleSave()} type="button">{isSaving ? "Salvando…" : editing ? "Salvar alterações" : `Criar ${kindLabel}`}</button>
        </div>
      </aside>
    </>
  );
}
