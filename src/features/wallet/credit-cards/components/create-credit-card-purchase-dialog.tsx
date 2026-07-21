"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldError } from "react-hook-form";

import type { Category, CreditCardPurchase } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { listCategoriesData } from "@/features/categories/api/categories";
import { listActiveCreditCardsData } from "@/features/wallet/credit-cards/api/list-active-credit-cards";
import { getCreditCardErrorMessage } from "@/features/wallet/credit-cards/lib/credit-card-error-message";
import {
  defaultCreditCardPurchaseFormValues,
  toCreateCreditCardPurchasePayload,
} from "@/features/wallet/credit-cards/lib/credit-card-purchase-form-mappers";
import { useCreateCreditCardPurchase } from "@/features/wallet/credit-cards/mutations/use-create-credit-card-purchase";
import {
  creditCardPurchaseFormSchema,
  type CreditCardPurchaseFormValues,
} from "@/features/wallet/credit-cards/schemas/credit-card-purchase-form-schema";
import { ApiError } from "@/lib/http";

/**
 * Diálogo independente da tela Carteira para ser reutilizado também na ação
 * unificada de Transações. Ele próprio carrega os cartões e categorias ativos.
 */
type CreateCreditCardPurchaseDialogProps = {
  initialCreditCardId?: string;
  onClose: () => void;
  onCreated: (purchase: CreditCardPurchase) => void;
  open: boolean;
};

export function CreateCreditCardPurchaseDialog({
  initialCreditCardId,
  onClose,
  onCreated,
  open,
}: CreateCreditCardPurchaseDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cards = useQuery({
    queryKey: ["credit-cards", { isActive: true }],
    queryFn: listActiveCreditCardsData,
    enabled: open,
    retry: false,
  });
  const categories = useQuery<Category[], ApiError>({
    queryKey: ["categories", { isActive: true, purpose: "credit-card-purchase" }],
    queryFn: () => listCategoriesData({ isActive: true }),
    enabled: open,
    retry: false,
  });
  const mutation = useCreateCreditCardPurchase();
  const defaultValues = useMemo(
    () => defaultCreditCardPurchaseFormValues(initialCreditCardId),
    [initialCreditCardId],
  );
  const expenseCategories = useMemo(
    () => (categories.data ?? []).filter((category) => category.type === "expense" || category.type === "both"),
    [categories.data],
  );
  const optionsError = cards.isError || categories.isError;
  const optionsReady = !cards.isPending && !categories.isPending && !optionsError;

  async function handleSubmit(values: CreditCardPurchaseFormValues) {
    setSubmitError(null);
    try {
      const purchase = await mutation.mutateAsync(toCreateCreditCardPurchasePayload(values));
      onCreated(purchase);
    } catch (error) {
      setSubmitError(getCreditCardErrorMessage(error, "purchase"));
    }
  }

  return (
    <Dialog
      busy={mutation.isPending}
      description="A API criará as parcelas e faturas futuras conforme o cartão e a data informados."
      descriptionId="create-credit-card-purchase-dialog-description"
      initialFocusSelector={
        optionsReady
          ? "#create-credit-card-purchase-description"
          : "#create-credit-card-purchase-cancel"
      }
      onClose={onClose}
      open={open}
      title="Nova compra no cartão"
      titleId="create-credit-card-purchase-title"
    >
      <CreditCardPurchaseForm
        optionsError={optionsError}
        creditCards={cards.data ?? []}
        defaultValues={defaultValues}
        expenseCategories={expenseCategories}
        isSubmitting={mutation.isPending}
        onCancel={onClose}
        onSubmit={handleSubmit}
        optionsReady={optionsReady}
        open={open}
        submitError={submitError}
      />
    </Dialog>
  );
}

type CreditCardPurchaseFormProps = {
  optionsError: boolean;
  creditCards: Awaited<ReturnType<typeof listActiveCreditCardsData>>;
  defaultValues: CreditCardPurchaseFormValues;
  expenseCategories: Category[];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CreditCardPurchaseFormValues) => void | Promise<void>;
  optionsReady: boolean;
  open: boolean;
  submitError: string | null;
};

function CreditCardPurchaseForm({
  optionsError,
  creditCards,
  defaultValues,
  expenseCategories,
  isSubmitting,
  onCancel,
  onSubmit,
  optionsReady,
  open,
  submitError,
}: CreditCardPurchaseFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreditCardPurchaseFormValues>({
    resolver: zodResolver(creditCardPurchaseFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open && optionsReady) reset(defaultValues);
  }, [defaultValues, open, optionsReady, reset]);

  const disabled = isSubmitting || !optionsReady;
  const fieldId = (name: keyof CreditCardPurchaseFormValues) => `create-credit-card-purchase-${name}`;
  const errorId = (name: keyof CreditCardPurchaseFormValues) => `${fieldId(name)}-error`;
  const inputProps = (name: keyof CreditCardPurchaseFormValues, error?: FieldError) => ({
    "aria-describedby": error ? errorId(name) : undefined,
    "aria-invalid": error ? true : undefined,
    disabled,
    id: fieldId(name),
  });

  return (
    <form className="account-form" id="create-credit-card-purchase-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="account-form-grid">
        <label className="account-field" htmlFor={fieldId("creditCardId")}>
          <span>Cartão</span>
          <select {...inputProps("creditCardId", errors.creditCardId)} {...register("creditCardId")}>
            <option value="">Selecione um cartão</option>
            {creditCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}{card.lastFourDigits ? ` · •••• ${card.lastFourDigits}` : ""}
              </option>
            ))}
          </select>
          <FieldErrorMessage error={errors.creditCardId} id={errorId("creditCardId")} />
        </label>

        <label className="account-field" htmlFor={fieldId("categoryId")}>
          <span>Categoria (opcional)</span>
          <select {...inputProps("categoryId", errors.categoryId)} {...register("categoryId")}>
            <option value="">Sem categoria</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldErrorMessage error={errors.categoryId} id={errorId("categoryId")} />
        </label>

        <label className="account-field" htmlFor={fieldId("description")}>
          <span>Descrição</span>
          <input
            autoComplete="off"
            data-dialog-initial-focus
            placeholder="Ex.: Mercado"
            type="text"
            {...inputProps("description", errors.description)}
            {...register("description")}
          />
          <FieldErrorMessage error={errors.description} id={errorId("description")} />
        </label>

        <label className="account-field" htmlFor={fieldId("totalAmount")}>
          <span>Valor total</span>
          <input
            autoComplete="off"
            inputMode="decimal"
            placeholder="Ex.: 189,90"
            type="text"
            {...inputProps("totalAmount", errors.totalAmount)}
            {...register("totalAmount")}
          />
          <FieldErrorMessage error={errors.totalAmount} id={errorId("totalAmount")} />
        </label>

        <label className="account-field" htmlFor={fieldId("purchaseDate")}>
          <span>Data e hora local</span>
          <input
            type="datetime-local"
            {...inputProps("purchaseDate", errors.purchaseDate)}
            {...register("purchaseDate")}
          />
          <FieldErrorMessage error={errors.purchaseDate} id={errorId("purchaseDate")} />
        </label>

        <label className="account-field" htmlFor={fieldId("installmentCount")}>
          <span>Quantidade de parcelas</span>
          <input
            inputMode="numeric"
            max={120}
            min={1}
            type="number"
            {...inputProps("installmentCount", errors.installmentCount)}
            {...register("installmentCount")}
          />
          <FieldErrorMessage error={errors.installmentCount} id={errorId("installmentCount")} />
        </label>
      </div>

      {!optionsReady ? (
        <p className="account-form-note" role={optionsError ? "alert" : "status"}>
          {optionsError
            ? "Não foi possível carregar cartões ou categorias ativos. Feche e abra novamente para tentar de novo."
            : "Carregando cartões e categorias disponíveis…"}
        </p>
      ) : null}
      {submitError ? (
        <p className="account-form-error" role="alert">
          {submitError}
        </p>
      ) : null}
      <div className="account-form-actions">
        <button
          className="secondary-button"
          disabled={isSubmitting}
          id="create-credit-card-purchase-cancel"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button className="primary-button" disabled={disabled} type="submit">
          {isSubmitting ? "Registrando…" : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}

function FieldErrorMessage({ error, id }: { error?: FieldError; id: string }) {
  return error ? (
    <small className="field-error" id={id} role="alert">
      {error.message}
    </small>
  ) : null;
}
