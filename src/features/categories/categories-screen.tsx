"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, RefreshCw, Tags } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { Category } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  archiveCategoryData,
  createCategoryData,
  updateCategoryData,
} from "@/features/categories/api/categories";
import {
  categoryFormSchema,
  categoryTypeLabel,
  categoryTypeOptions,
  getCategoryErrorMessage,
  toCategoryFormValues,
  toCreateCategoryPayload,
  toUpdateCategoryPayload,
  type CategoryFormValues,
} from "@/features/categories/lib/category-form";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import {
  type CategoriesFilters,
  type CategoryStatusFilter,
  type CategoryTypeFilter,
  useCategories,
} from "@/features/categories/queries/use-categories";

const initialFilters: CategoriesFilters = { status: "active", type: "all" };

export function CategoriesScreen() {
  const [filters, setFilters] = useState<CategoriesFilters>(initialFilters);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [archiving, setArchiving] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const query = useCategories(filters);

  const refresh = () => { if (!query.isFetching) void query.refetch({ cancelRefetch: false }); };
  const hasFilters = filters.status !== "active" || filters.type !== "all";

  return (
    <section className="resource-screen" aria-labelledby="categories-title">
      <div className="resource-heading-row">
        <PageHeader eyebrow="Organização" title="Categorias" titleId="categories-title" description="Classifique receitas e despesas sem perder vínculos históricos." />
        <div className="resource-heading-actions">
          <button className="secondary-button" disabled={query.isFetching} onClick={refresh} type="button">
            <RefreshCw aria-hidden="true" className={query.isFetching ? "is-spinning" : undefined} size={16} /> Atualizar
          </button>
          <button className="primary-button" onClick={() => { setFeedback(null); setIsCreating(true); }} type="button"><Plus aria-hidden="true" size={16} /> Nova categoria</button>
        </div>
      </div>
      <CategoryFilters filters={filters} onChange={setFilters} />
      {feedback ? <p className="mutation-feedback" role="status">{feedback}</p> : null}
      {query.isPending && !query.data ? <CategorySkeleton /> : null}
      {query.isError && !query.data ? <ErrorState title="Categorias indisponíveis" description="Não foi possível carregar suas categorias agora." onRetry={refresh} /> : null}
      {query.data ? <div className="resource-content" aria-busy={query.isFetching}>
        {query.isFetching && !query.isRefetchError ? <p className="resource-refreshing" role="status">Atualizando categorias…</p> : null}
        {query.isRefetchError ? <RefetchAlert onRetry={refresh} /> : null}
        {query.data.length === 0 ? <EmptyState icon={Tags} title={hasFilters ? "Nenhuma categoria corresponde aos filtros selecionados." : "Nenhuma categoria ativa foi encontrada."} description={hasFilters ? "Altere ou limpe os filtros para consultar outras categorias." : "Crie a primeira categoria para classificar seus lançamentos."} /> : <CategoryList categories={query.data} onArchive={setArchiving} onEdit={setEditing} />}
      </div> : null}
      {isCreating ? <CategoryDialog mode="create" onClose={() => setIsCreating(false)} onSaved={(message) => { setIsCreating(false); setFeedback(message); }} /> : null}
      {editing ? <CategoryDialog category={editing} mode="edit" onClose={() => setEditing(null)} onSaved={(message) => { setEditing(null); setFeedback(message); }} /> : null}
      {archiving ? <ArchiveCategoryDialog category={archiving} onClose={() => setArchiving(null)} onArchived={() => { setArchiving(null); setFeedback("Categoria arquivada com sucesso."); }} /> : null}
    </section>
  );
}

function CategoryFilters({ filters, onChange }: { filters: CategoriesFilters; onChange: (filters: CategoriesFilters) => void }) {
  return <div className="resource-filters" aria-label="Filtros de categorias">
    <label><span>Status</span><select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as CategoryStatusFilter })}><option value="active">Ativas</option><option value="archived">Arquivadas</option><option value="all">Todas</option></select></label>
    <label><span>Tipo</span><select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value as CategoryTypeFilter })}><option value="all">Todos</option>{categoryTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
  </div>;
}

function CategoryList({ categories, onEdit, onArchive }: { categories: Category[]; onEdit: (category: Category) => void; onArchive: (category: Category) => void }) {
  return <ul className="resource-list category-list" aria-label="Categorias">
    {categories.map((category) => { const presentation = categoryPresentation(category); return <li className={!category.isActive ? "is-archived" : undefined} key={category.id}>
      <span className="category-mark" style={{ "--category-accent": presentation.color } as CSSProperties}><presentation.Icon aria-hidden="true" size={18} /></span>
      <div className="resource-item-main"><strong>{category.name}</strong><span>{categoryTypeLabel(category.type)} · {category.isActive ? "Ativa" : "Arquivada"}</span></div>
      <div className="resource-item-actions">
        {category.isActive ? <><button aria-label={`Editar ${category.name}`} className="icon-button" onClick={() => onEdit(category)} type="button"><Pencil aria-hidden="true" size={16} /></button><button aria-label={`Arquivar ${category.name}`} className="icon-button" onClick={() => onArchive(category)} type="button"><Archive aria-hidden="true" size={16} /></button></> : <span className="status-badge">Arquivada</span>}
      </div>
    </li>; })}</ul>;
}

function CategoryDialog({ mode, category, onClose, onSaved }: { mode: "create" | "edit"; category?: Category; onClose: () => void; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CategoryFormValues>({ resolver: zodResolver(categoryFormSchema), defaultValues: category ? toCategoryFormValues(category) : { name: "", type: "expense" } });
  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) => mode === "create" ? createCategoryData(toCreateCategoryPayload(values)) : updateCategoryData(category!.id, toUpdateCategoryPayload(values)),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["categories"] }); },
  });
  const errors = form.formState.errors;
  const id = `${mode}-category`;
  async function submit(values: CategoryFormValues) { setSubmitError(null); try { await mutation.mutateAsync(values); onSaved(mode === "create" ? "Categoria criada com sucesso." : "Categoria atualizada com sucesso."); } catch (error) { setSubmitError(getCategoryErrorMessage(error)); } }
  return <Dialog busy={mutation.isPending} description="Os campos seguem o contrato da API." descriptionId={`${id}-description`} initialFocusSelector={`#${id}-name`} onClose={onClose} open title={mode === "create" ? "Nova categoria" : "Editar categoria"} titleId={`${id}-title`}>
    <form className="account-form" noValidate onSubmit={form.handleSubmit(submit)}>
      <label className="account-field" htmlFor={`${id}-name`}><span>Nome</span><input aria-describedby={errors.name ? `${id}-name-error` : undefined} aria-invalid={errors.name ? true : undefined} autoComplete="off" data-dialog-initial-focus disabled={mutation.isPending} id={`${id}-name`} placeholder="Ex.: Alimentação" {...form.register("name")} />{errors.name ? <small className="field-error" id={`${id}-name-error`} role="alert">{errors.name.message}</small> : null}</label>
      <label className="account-field" htmlFor={`${id}-type`}><span>Tipo</span><select aria-describedby={errors.type ? `${id}-type-error` : undefined} aria-invalid={errors.type ? true : undefined} disabled={mutation.isPending} id={`${id}-type`} {...form.register("type")}>{categoryTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{errors.type ? <small className="field-error" id={`${id}-type-error`} role="alert">{errors.type.message}</small> : null}</label>
      {submitError ? <p className="account-form-error" role="alert">{submitError}</p> : null}
      <div className="account-form-actions"><button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">Cancelar</button><button className="primary-button" disabled={mutation.isPending} type="submit">{mutation.isPending ? "Salvando…" : "Salvar"}</button></div>
    </form>
  </Dialog>;
}

function ArchiveCategoryDialog({ category, onClose, onArchived }: { category: Category; onClose: () => void; onArchived: () => void }) {
  const client = useQueryClient(); const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: () => archiveCategoryData(category.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["categories"] }); } });
  async function archive() { setError(null); try { await mutation.mutateAsync(); onArchived(); } catch (cause) { setError(getCategoryErrorMessage(cause)); } }
  return <Dialog busy={mutation.isPending} description="Ela deixará de estar disponível para novos lançamentos. Transações e demais registros históricos permanecerão vinculados. Orçamentos ativos vinculados também serão arquivados." descriptionId="archive-category-description" onClose={onClose} open title="Arquivar esta categoria?" titleId="archive-category-title">
    <div className="confirmation-dialog"><p><strong>{category.name}</strong> · {categoryTypeLabel(category.type)}</p>{error ? <p className="account-form-error" role="alert">{error}</p> : null}<div className="account-form-actions"><button className="secondary-button" disabled={mutation.isPending} onClick={onClose} type="button">Cancelar</button><button className="danger-button" disabled={mutation.isPending} onClick={() => void archive()} type="button">{mutation.isPending ? "Arquivando…" : "Arquivar categoria"}</button></div></div>
  </Dialog>;
}

function RefetchAlert({ onRetry }: { onRetry: () => void }) { return <div className="resource-refetch-alert" role="alert"><span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span><button className="secondary-button" onClick={onRetry} type="button">Tentar novamente</button></div>; }
function CategorySkeleton() { return <div className="resource-skeleton" aria-label="Carregando categorias" role="status"><span /><span /><span /></div>; }
