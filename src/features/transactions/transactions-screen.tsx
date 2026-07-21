"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Pencil, Plus, ReceiptText, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { Account, Category, ListTransactionsParams, PaymentMethod, Transaction, TransactionType } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { NewMovementDialog } from "@/features/transactions/components/new-movement-dialog";
import { TransactionDetailsDialog } from "@/features/transactions/components/transaction-details-dialog";
import { TransactionPeriodSummary } from "@/features/transactions/components/transaction-period-summary";
import { TransactionTransferDialog } from "@/features/transactions/components/transaction-transfer-dialog";
import { listTransactionAccountsData, listTransactionCategoriesData, createTransactionData, deleteTransactionData, updateTransactionData } from "@/features/transactions/api/transactions";
import { compatibleCategories, getTransactionErrorMessage, paymentMethodLabel, paymentMethodOptions, toCreateTransactionPayload, toTransactionFormValues, toUpdateTransactionPayload, transactionFormSchema, transactionTypeOptions, type TransactionFormValues } from "@/features/transactions/lib/transaction-form";
import { transactionAccountLabel, transactionCategoryLabel } from "@/features/transactions/lib/transaction-presentation";
import { useTransactionMonthlySummary } from "@/features/transactions/queries/use-monthly-summary";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
import { ApiError } from "@/lib/http";
import { formatCurrency } from "@/lib/format";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";
import { CreateCreditCardPurchaseDialog } from "@/features/wallet/credit-cards/components/create-credit-card-purchase-dialog";

type TransactionFilters = { type: "all" | TransactionType; startDate: string; endDate: string; categoryId: string; accountId: string; paymentMethod: "" | PaymentMethod };
const initialFilters: TransactionFilters = { type: "all", startDate: "", endDate: "", categoryId: "", accountId: "", paymentMethod: "" };

function toQueryParams(filters: TransactionFilters): ListTransactionsParams | null {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) return null;
  return {
    ...(filters.type === "all" ? {} : { type: filters.type }),
    ...(filters.startDate ? { startDate: `${filters.startDate}T00:00:00.000Z` } : {}),
    ...(filters.endDate ? { endDate: `${filters.endDate}T23:59:59.999Z` } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
  };
}

function getSummaryPeriod(startDate: string, endDate: string) {
  const referenceDate = startDate || endDate;
  if (referenceDate) {
    const [year, month] = referenceDate.split("-").map(Number);
    return { year, month };
  }

  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function formatSummaryPeriod({ year, month }: { year: number; month: number }) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function TransactionsScreen() {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [creatingType, setCreatingType] = useState<TransactionType | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const params = toQueryParams(filters);
  const invalidRange = params === null;
  const transactions = useTransactions(params, { enabled: !invalidRange });
  const summaryPeriod = useMemo(() => getSummaryPeriod(filters.startDate, filters.endDate), [filters.endDate, filters.startDate]);
  const monthlySummary = useTransactionMonthlySummary(summaryPeriod);
  const categories = useQuery<Category[], ApiError>({ queryKey: ["categories", { includeArchived: true, purpose: "transactions" }], queryFn: listTransactionCategoriesData, retry: false });
  const accounts = useQuery<Account[], ApiError>({ queryKey: ["transaction-accounts"], queryFn: listTransactionAccountsData, retry: false });
  const categoryById = useMemo(() => new Map((categories.data ?? []).map((item) => [item.id, item])), [categories.data]);
  const accountById = useMemo(() => new Map((accounts.data ?? []).map((item) => [item.id, item])), [accounts.data]);
  const activeAccounts = (accounts.data ?? []).filter((account) => account.isActive);
  const refresh = () => { if (!transactions.isFetching && !monthlySummary.isFetching && !invalidRange) void Promise.all([transactions.refetch({ cancelRefetch: false }), monthlySummary.refetch({ cancelRefetch: false })]); };
  const hasFilters = Object.values(filters).some(Boolean) && filters.type !== "all" ? true : Boolean(filters.startDate || filters.endDate || filters.categoryId || filters.accountId || filters.paymentMethod);

  return <section className="resource-screen" aria-labelledby="transactions-title">
    <div className="resource-heading-row"><PageHeader eyebrow="Organização" title="Transações" titleId="transactions-title" description="Registre movimentações realizadas; saldos, resumos e projeções são calculados pela API." /><div className="resource-heading-actions"><button className="secondary-button" disabled={transactions.isFetching || monthlySummary.isFetching || invalidRange} onClick={refresh} type="button"><RefreshCw aria-hidden="true" className={transactions.isFetching || monthlySummary.isFetching ? "is-spinning" : undefined} size={16} /> Atualizar</button><button className="primary-button" onClick={() => { setFeedback(null); setIsNewMovementOpen(true); }} type="button"><Plus aria-hidden="true" size={16} /> Nova movimentação</button></div></div>
    <TransactionFiltersForm accounts={accounts.data ?? []} categories={categories.data ?? []} filters={filters} invalidRange={invalidRange} onChange={setFilters} />
    <TransactionPeriodSummary isError={monthlySummary.isError} isLoading={monthlySummary.isFetching} periodLabel={formatSummaryPeriod(summaryPeriod)} summary={monthlySummary.data} />
    {feedback ? <p className="mutation-feedback" role="status">{feedback}</p> : null}
    {invalidRange ? <div className="resource-refetch-alert" id="transactions-range-error" role="alert">A data inicial deve ser anterior ou igual à data final.</div> : null}
    {transactions.isPending && !transactions.data ? <TransactionSkeleton /> : null}
    {transactions.isError && !transactions.data ? <ErrorState title="Transações indisponíveis" description="Não foi possível carregar suas transações agora." onRetry={refresh} /> : null}
    {transactions.data ? <div className="resource-content" aria-busy={transactions.isFetching}>
      {transactions.isFetching && !transactions.isRefetchError ? <p className="resource-refreshing" role="status">Atualizando transações…</p> : null}
      {transactions.isRefetchError ? <RefetchAlert onRetry={refresh} /> : null}
      {transactions.data.length === 0 ? <EmptyState icon={ReceiptText} title={hasFilters ? "Nenhuma transação corresponde aos filtros selecionados." : "Nenhuma transação foi registrada."} description={hasFilters ? "Ajuste ou limpe os filtros para consultar outros lançamentos." : "Crie uma receita ou despesa para iniciar seu histórico."} /> : <TransactionList accountById={accountById} categoryById={categoryById} onDelete={setDeleting} onEdit={setEditing} onView={setViewing} transactions={transactions.data} />}
    </div> : null}
    {isNewMovementOpen ? <NewMovementDialog canTransfer={activeAccounts.length >= 2} onClose={() => setIsNewMovementOpen(false)} onSelect={(kind) => { setIsNewMovementOpen(false); if (kind === "expense" || kind === "income") setCreatingType(kind); if (kind === "transfer") setIsTransferring(true); if (kind === "credit-card-purchase") setIsPurchasing(true); }} open /> : null}
    {creatingType ? <TransactionDialog accounts={accounts.data ?? []} categories={categories.data ?? []} initialType={creatingType} mode="create" onClose={() => setCreatingType(null)} onSaved={(message) => { setCreatingType(null); setFeedback(message); }} /> : null}
    {isTransferring && activeAccounts[0] ? <TransactionTransferDialog initialSourceAccountId={activeAccounts[0].id} onClose={() => setIsTransferring(false)} onTransferred={() => { setIsTransferring(false); setFeedback("Transferência realizada com sucesso."); }} /> : null}
    {isPurchasing ? <CreateCreditCardPurchaseDialog onClose={() => setIsPurchasing(false)} onCreated={() => { setIsPurchasing(false); setFeedback("Compra no cartão registrada com sucesso."); }} open /> : null}
    {editing ? <TransactionDialog accounts={accounts.data ?? []} categories={categories.data ?? []} mode="edit" transaction={editing} onClose={() => setEditing(null)} onSaved={(message) => { setEditing(null); setFeedback(message); }} /> : null}
    {viewing ? <TransactionDetailsDialog accountsById={accountById} categoriesById={categoryById} onClose={() => setViewing(null)} onDelete={(transaction) => { setViewing(null); setDeleting(transaction); }} onEdit={(transaction) => { setViewing(null); setEditing(transaction); }} transaction={viewing} /> : null}
    {deleting ? <DeleteTransactionDialog transaction={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); setFeedback("Transação excluída com sucesso."); }} /> : null}
  </section>;
}

function TransactionFiltersForm({ filters, onChange, categories, accounts, invalidRange }: { filters: TransactionFilters; onChange: (value: TransactionFilters) => void; categories: Category[]; accounts: Account[]; invalidRange: boolean }) {
  const activeCategories = categories.filter((category) => category.isActive); const activeAccounts = accounts.filter((account) => account.isActive);
  return <div className="resource-filters transaction-filters" aria-label="Filtros de transações">
    <label><span>Tipo</span><select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value as TransactionFilters["type"] })}><option value="all">Todos</option>{transactionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <label><span>Início (UTC)</span><input aria-describedby={invalidRange ? "transactions-range-error" : undefined} aria-invalid={invalidRange || undefined} type="date" value={filters.startDate} onChange={(event) => onChange({ ...filters, startDate: event.target.value })} /></label>
    <label><span>Fim (UTC)</span><input aria-describedby={invalidRange ? "transactions-range-error" : undefined} aria-invalid={invalidRange || undefined} type="date" value={filters.endDate} onChange={(event) => onChange({ ...filters, endDate: event.target.value })} /></label>
    <label><span>Categoria</span><select value={filters.categoryId} onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}><option value="">Todas</option>{activeCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label><span>Conta</span><select value={filters.accountId} onChange={(event) => onChange({ ...filters, accountId: event.target.value })}><option value="">Todas</option>{activeAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label><span>Pagamento</span><select value={filters.paymentMethod} onChange={(event) => onChange({ ...filters, paymentMethod: event.target.value as TransactionFilters["paymentMethod"] })}><option value="">Todos</option>{paymentMethodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <button className="filter-clear-button" onClick={() => onChange(initialFilters)} type="button">Limpar filtros</button>
  </div>;
}

function TransactionList({ transactions, categoryById, accountById, onEdit, onDelete, onView }: { transactions: Transaction[]; categoryById: Map<string, Category>; accountById: Map<string, Account>; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void; onView: (transaction: Transaction) => void }) {
  const groups = new Map<string, Transaction[]>(); transactions.forEach((item) => { const key = item.occurredAt.slice(0, 10); groups.set(key, [...(groups.get(key) ?? []), item]); });
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" });
  return <div className="transaction-groups">{[...groups.entries()].map(([date, items]) => <section key={date}><h2>{dateFormatter.format(new Date(`${date}T00:00:00.000Z`))}</h2><ul className="resource-list transaction-list">{items.map((item) => <li key={item.id}><span className={`transaction-mark ${item.type}`}><CircleDollarSign aria-hidden="true" size={18} /></span><div className="resource-item-main"><strong>{item.description}</strong><span>{transactionCategoryLabel(item.categoryId, categoryById)} · {transactionAccountLabel(item.accountId, accountById)} · {paymentMethodLabel(item.paymentMethod)}</span><small>{formatUtcDateTime(item.occurredAt)}{item.source !== "app" ? ` · ${item.source === "telegram" ? "Telegram" : item.source}` : ""}</small></div><strong className={`transaction-amount ${item.type}`}>{item.type === "income" ? "+ " : "− "}{formatCurrency(item.amount)}</strong><div className="resource-item-actions"><button aria-label={`Ver detalhes de ${item.description}`} className="icon-button" onClick={() => onView(item)} type="button"><ReceiptText aria-hidden="true" size={16} /></button><button aria-label={`Editar ${item.description}`} className="icon-button" onClick={() => onEdit(item)} type="button"><Pencil aria-hidden="true" size={16} /></button><button aria-label={`Excluir ${item.description}`} className="icon-button" onClick={() => onDelete(item)} type="button"><Trash2 aria-hidden="true" size={16} /></button></div></li>)}</ul></section>)}</div>;
}

function TransactionDialog({ mode, transaction, categories, accounts, initialType, onClose, onSaved }: { mode: "create" | "edit"; transaction?: Transaction; categories: Category[]; accounts: Account[]; initialType?: TransactionType; onClose: () => void; onSaved: (message: string) => void }) {
  const queryClient = useQueryClient(); const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TransactionFormValues>({ resolver: zodResolver(transactionFormSchema), defaultValues: transaction ? toTransactionFormValues(transaction) : { ...toTransactionFormValues(), type: initialType ?? "expense" } });
  const type = useWatch({ control: form.control, name: "type" }); const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" }); const selectedAccountId = useWatch({ control: form.control, name: "accountId" });
  const availableCategories = compatibleCategories(categories, type); const activeAccounts = accounts.filter((account) => account.isActive);
  const mutation = useMutation({ mutationFn: (values: TransactionFormValues) => mode === "create" ? createTransactionData(toCreateTransactionPayload(values)) : updateTransactionData(transaction!.id, toUpdateTransactionPayload(values, transaction!)), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["transactions"] }), queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }), queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }), queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }), queryClient.invalidateQueries({ queryKey: ["financial-timeline"] })]); } });
  const id = `${mode}-transaction`; const errors = form.formState.errors;
  async function submit(values: TransactionFormValues) { setSubmitError(null); try { await mutation.mutateAsync(values); onSaved(mode === "create" ? "Transação criada com sucesso." : "Transação atualizada com sucesso."); } catch (error) { setSubmitError(getTransactionErrorMessage(error)); } }
  return <Dialog busy={mutation.isPending} description="Horários são informados no seu fuso local e enviados como ISO; a lista os exibe em UTC." descriptionId={`${id}-description`} initialFocusSelector={`#${id}-description-field`} onClose={onClose} open title={mode === "create" ? "Nova transação" : "Editar transação"} titleId={`${id}-title`}><form className="account-form transaction-form" noValidate onSubmit={form.handleSubmit(submit)}>
    <label className="account-field" htmlFor={`${id}-description-field`}><span>Descrição</span><input aria-describedby={errors.description ? `${id}-description-error` : undefined} aria-invalid={errors.description ? true : undefined} autoComplete="off" data-dialog-initial-focus disabled={mutation.isPending} id={`${id}-description-field`} placeholder="Ex.: Mercado" {...form.register("description")} />{errors.description ? <small className="field-error" id={`${id}-description-error`} role="alert">{errors.description.message}</small> : null}</label>
    <label className="account-field" htmlFor={`${id}-type`}><span>Tipo</span><select disabled={mutation.isPending} id={`${id}-type`} {...form.register("type", { onChange: () => form.setValue("categoryId", "", { shouldValidate: true }) })}>{transactionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <label className="account-field" htmlFor={`${id}-amount`}><span>Valor</span><input aria-describedby={errors.amount ? `${id}-amount-error` : undefined} aria-invalid={errors.amount ? true : undefined} disabled={mutation.isPending} id={`${id}-amount`} inputMode="decimal" placeholder="Ex.: 120,50" {...form.register("amount")} />{errors.amount ? <small className="field-error" id={`${id}-amount-error`} role="alert">{errors.amount.message}</small> : null}</label>
    <label className="account-field" htmlFor={`${id}-occurredAt`}><span>Data e hora local</span><input aria-describedby={errors.occurredAt ? `${id}-occurredAt-error` : undefined} aria-invalid={errors.occurredAt ? true : undefined} disabled={mutation.isPending} id={`${id}-occurredAt`} type="datetime-local" {...form.register("occurredAt")} />{errors.occurredAt ? <small className="field-error" id={`${id}-occurredAt-error`} role="alert">{errors.occurredAt.message}</small> : null}</label>
    <label className="account-field" htmlFor={`${id}-category`}><span>Categoria (opcional)</span><select disabled={mutation.isPending} id={`${id}-category`} {...form.register("categoryId")}><option value="">Sem categoria</option>{selectedCategoryId && !availableCategories.some((item) => item.id === selectedCategoryId) ? <option disabled value={selectedCategoryId}>{categories.find((item) => item.id === selectedCategoryId)?.name ?? "Categoria histórica"} (Arquivada)</option> : null}{availableCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="account-field" htmlFor={`${id}-account`}><span>Conta (opcional)</span><select disabled={mutation.isPending} id={`${id}-account`} {...form.register("accountId")}><option value="">Sem conta</option>{selectedAccountId && !activeAccounts.some((item) => item.id === selectedAccountId) ? <option disabled value={selectedAccountId}>{accounts.find((item) => item.id === selectedAccountId)?.name ?? "Conta arquivada ou indisponível"}</option> : null}{activeAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="account-field" htmlFor={`${id}-paymentMethod`}><span>Método de pagamento (opcional)</span><select disabled={mutation.isPending} id={`${id}-paymentMethod`} {...form.register("paymentMethod")}><option value="">Não informado</option>{paymentMethodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {submitError ? <p className="account-form-error" role="alert">{submitError}</p> : null}<div className="account-form-actions"><button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">Cancelar</button><button className="primary-button" disabled={mutation.isPending} type="submit">{mutation.isPending ? "Salvando…" : "Salvar"}</button></div>
  </form></Dialog>;
}

function DeleteTransactionDialog({ transaction, onClose, onDeleted }: { transaction: Transaction; onClose: () => void; onDeleted: () => void }) {
  const client = useQueryClient(); const [error, setError] = useState<string | null>(null); const mutation = useMutation({ mutationFn: () => deleteTransactionData(transaction.id), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["transactions"] }), client.invalidateQueries({ queryKey: ["monthly-summary"] }), client.invalidateQueries({ queryKey: ["wallet-overview"] }), client.invalidateQueries({ queryKey: ["dashboard-overview"] }), client.invalidateQueries({ queryKey: ["financial-timeline"] })]); } });
  async function destroy() { setError(null); try { await mutation.mutateAsync(); onDeleted(); } catch (cause) { setError(getTransactionErrorMessage(cause, "delete")); } }
  return <Dialog busy={mutation.isPending} description="Esta ação removerá permanentemente a transação e poderá alterar saldos, resumos e projeções." descriptionId="delete-transaction-description" onClose={onClose} open title="Excluir transação?" titleId="delete-transaction-title"><div className="confirmation-dialog"><p><strong>{transaction.description}</strong><br />{formatUtcDateTime(transaction.occurredAt)} · {formatCurrency(transaction.amount)}</p>{error ? <p className="account-form-error" role="alert">{error}</p> : null}<div className="account-form-actions"><button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">Cancelar</button><button className="danger-button" disabled={mutation.isPending} onClick={() => void destroy()} type="button">{mutation.isPending ? "Excluindo…" : "Excluir transação"}</button></div></div></Dialog>;
}

function RefetchAlert({ onRetry }: { onRetry: () => void }) { return <div className="resource-refetch-alert" role="alert"><span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span><button className="secondary-button" onClick={onRetry} type="button">Tentar novamente</button></div>; }
function TransactionSkeleton() { return <div className="resource-skeleton" aria-label="Carregando transações" role="status"><span /><span /><span /></div>; }
