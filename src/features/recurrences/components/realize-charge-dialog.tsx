"use client";

import { CheckCircle2, CreditCard, Landmark } from "lucide-react";
import { useState } from "react";

import type { Account, Category, CreditCard as CreditCardType, PaymentMethod } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getRecurrenceErrorMessage } from "@/features/recurrences/lib/recurrence-error-message";
import type { RecurrenceRailItem } from "@/features/recurrences/lib/recurrence-presentation";
import {
  useRealizeFixedOccurrence,
  useRealizeSubscriptionCharge,
} from "@/features/recurrences/mutations/use-recurrence-mutations";
import { nowDateTimeLocal } from "@/features/transactions/lib/transaction-form";
import { formatCurrency } from "@/lib/format";

type RealizeChargeDialogProps = {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCardType[];
  item: RecurrenceRailItem | null;
  onClose: () => void;
  onRealized: (message: string) => void;
  open: boolean;
};

type RealizeFormValues = {
  accountId: string;
  categoryId: string;
  creditCardId: string;
  occurredAt: string;
  paymentMethod: "" | PaymentMethod;
};

const paymentMethods: Array<{ value: Exclude<PaymentMethod, "credit">; label: string }> = [
  { value: "pix", label: "PIX" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
];

function emptyValues(): RealizeFormValues {
  return { accountId: "", categoryId: "", creditCardId: "", occurredAt: nowDateTimeLocal(), paymentMethod: "" };
}

export function RealizeChargeDialog({
  accounts,
  categories,
  creditCards,
  item,
  onClose,
  onRealized,
  open,
}: RealizeChargeDialogProps) {
  const realizeCharge = useRealizeSubscriptionCharge();
  const realizeOccurrence = useRealizeFixedOccurrence();
  const [values, setValues] = useState<RealizeFormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"transaction" | "purchase" | null>(null);
  const session = open && item ? `${item.source}:${item.id}` : null;
  const [lastSession, setLastSession] = useState<string | null>(null);

  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setValues(emptyValues());
      setError(null);
      setResult(null);
    }
  }

  if (!item) return null;
  const recurrence = item;

  const activeAccounts = accounts.filter((account) => account.isActive);
  const activeCards = creditCards.filter((card) => card.isActive);
  const categoryLabel = recurrence.categoryId
    ? categories.find((category) => category.id === recurrence.categoryId)?.name ?? "categoria indisponível"
    : "sem categoria";
  const inheritedAccountName = recurrence.accountId
    ? accounts.find((account) => account.id === recurrence.accountId)?.name ?? "conta indisponível"
    : "nenhuma conta";
  const inheritedCardName = recurrence.creditCardId
    ? creditCards.find((card) => card.id === recurrence.creditCardId)?.name ?? "cartão indisponível"
    : "nenhum cartão";
  const effectiveAccountId = values.accountId || recurrence.accountId;
  const effectiveCreditCardId = values.creditCardId || (values.accountId ? null : recurrence.creditCardId);
  const effectivePaymentMethod = values.paymentMethod || recurrence.paymentMethod;
  const isBusy = realizeCharge.isPending || realizeOccurrence.isPending;
  const usesCard = Boolean(effectiveCreditCardId);
  const needsAccount = recurrence.source === "fixed" && !effectiveAccountId;
  const needsPaymentMethod = recurrence.source === "fixed" && !usesCard && !effectivePaymentMethod;

  function update(patch: Partial<RealizeFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleRealize() {
    const occurredAt = new Date(values.occurredAt);
    setError(null);
    if (Number.isNaN(occurredAt.getTime())) {
      setError("Informe uma data e hora válidas.");
      return;
    }
    if (occurredAt.getTime() > Date.now()) {
      setError("A realização não pode estar no futuro.");
      return;
    }
    if (needsAccount) {
      setError("Escolha a conta que receberá esta ocorrência.");
      return;
    }
    if (needsPaymentMethod) {
      setError("Escolha o meio de pagamento desta ocorrência.");
      return;
    }
    if (values.accountId && !values.paymentMethod) {
      setError("Escolha o meio de pagamento da conta selecionada.");
      return;
    }

    try {
      if (recurrence.source === "subscription") {
        const payload = {
          occurredAt: occurredAt.toISOString(),
          ...(values.categoryId ? { categoryId: values.categoryId } : {}),
          ...(values.accountId
            ? { accountId: values.accountId, paymentMethod: values.paymentMethod as PaymentMethod }
            : values.creditCardId
              ? { creditCardId: values.creditCardId }
              : {}),
        };
        const realized = await realizeCharge.mutateAsync({ id: recurrence.id, payload });
        setResult(realized.creditCardPurchase ? "purchase" : "transaction");
        onRealized(realized.creditCardPurchase ? "Cobrança realizada como compra no cartão." : "Cobrança realizada como transação.");
      } else {
        const payload = {
          occurredAt: occurredAt.toISOString(),
          ...(values.categoryId ? { categoryId: values.categoryId } : {}),
          ...(values.accountId ? { accountId: values.accountId } : {}),
          ...(values.paymentMethod ? { paymentMethod: values.paymentMethod as PaymentMethod } : {}),
        };
        await realizeOccurrence.mutateAsync({ id: recurrence.id, payload });
        setResult("transaction");
        onRealized("Ocorrência realizada como transação.");
      }
    } catch (mutationError) {
      setError(getRecurrenceErrorMessage(mutationError, "realize"));
    }
  }

  if (result) {
    return (
      <Dialog description="A pendência foi registrada pela API." descriptionId="realize-result-description" onClose={onClose} open={open} title="Pendência realizada" titleId="realize-result-title">
        <div className="confirmation-dialog rcx-result-panel">
          <CheckCircle2 aria-hidden="true" color="var(--green)" size={30} />
          <p><strong>{item.name}</strong> foi realizado(a) no valor de {formatCurrency(item.amount)}.</p>
          <p>{result === "purchase" ? "Uma compra no cartão e suas parcelas foram criadas." : "Uma transação foi criada na conta escolhida."}</p>
          <div className="account-form-actions"><button className="primary-button" id="realize-result-close" onClick={onClose} type="button">Concluir</button></div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog busy={isBusy} description="Confira os dados herdados ou informe ajustes para esta realização." descriptionId="realize-charge-description" initialFocusSelector="#realize-charge-confirm" onClose={onClose} open={open} title={`Realizar ${item.name}`} titleId="realize-charge-title">
      <div className="confirmation-dialog rcx-realize-dialog">
        <p><strong>{formatCurrency(item.amount)}</strong> · {item.source === "subscription" ? "Cobrança de assinatura" : item.type === "expense" ? "Gasto fixo" : "Renda fixa"}.</p>
        <label className="account-form-field"><span>Data e hora</span><input onChange={(event) => update({ occurredAt: event.target.value })} type="datetime-local" value={values.occurredAt} /></label>
        <label className="account-form-field"><span>Categoria</span><select onChange={(event) => update({ categoryId: event.target.value })} value={values.categoryId}><option value="">Herdar: {categoryLabel}</option>{categories.filter((category) => category.isActive && (category.type === item.type || category.type === "both")).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>

        <label className="account-form-field"><span>Conta</span><select onChange={(event) => update({ accountId: event.target.value, creditCardId: "", paymentMethod: event.target.value ? values.paymentMethod || item.paymentMethod || "pix" : "" })} value={values.accountId}><option value="">{item.accountId ? `Herdar: ${inheritedAccountName}` : "Escolha a conta"}</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>

        {item.source === "subscription" ? (
          <label className="account-form-field"><span>Cartão</span><select onChange={(event) => update({ creditCardId: event.target.value, accountId: "", paymentMethod: "" })} value={values.creditCardId}><option value="">{item.creditCardId ? `Herdar: ${inheritedCardName}` : "Não usar cartão"}</option>{activeCards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
        ) : null}

        {!usesCard ? (
          <label className="account-form-field"><span>Meio de pagamento</span><select onChange={(event) => update({ paymentMethod: event.target.value as RealizeFormValues["paymentMethod"] })} value={values.paymentMethod}><option value="">{item.paymentMethod ? `Herdar: ${item.paymentMethod}` : "Escolha o meio"}</option>{paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label>
        ) : <p className="rcx-inherited-note"><CreditCard aria-hidden="true" size={14} /> Cartão selecionado: não é necessário meio de pagamento.</p>}

        {item.source === "fixed" ? <p className="rcx-inherited-note"><Landmark aria-hidden="true" size={14} /> Ocorrências fixas sempre geram uma transação em conta.</p> : null}
        {error ? <p className="account-form-error" role="alert">{error}</p> : null}
        <div className="account-form-actions"><button className="secondary-button" disabled={isBusy} onClick={onClose} type="button">Cancelar</button><button className="primary-button" disabled={isBusy} id="realize-charge-confirm" onClick={() => void handleRealize()} type="button">{isBusy ? "Realizando…" : "Realizar"}</button></div>
      </div>
    </Dialog>
  );
}
