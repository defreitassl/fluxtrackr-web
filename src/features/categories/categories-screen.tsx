"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, Tag, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Category, Transaction } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { archiveCategoryData } from "@/features/categories/api/categories";
import { CategoriesRail, type CategoryUsage } from "@/features/categories/components/categories-rail";
import { CategoryDrawer } from "@/features/categories/components/category-drawer";
import { getCategoryErrorMessage } from "@/features/categories/lib/category-form";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { useCategories } from "@/features/categories/queries/use-categories";
import {
  currentMonthValue,
  toListParams,
} from "@/features/transactions/lib/transactions-filters";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { useGlobalSearch } from "@/providers/search-provider";

type TypeTab = "all" | "expense" | "income";

function buildUsage(transactions: Transaction[]): CategoryUsage {
  const usage: CategoryUsage = new Map();
  for (const transaction of transactions) {
    if (!transaction.categoryId) continue;
    const entry = usage.get(transaction.categoryId) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(transaction.amount);
    usage.set(transaction.categoryId, entry);
  }
  return usage;
}

function CategoryCard({
  category,
  usage,
  onEdit,
  onArchive,
}: {
  category: Category;
  usage: CategoryUsage;
  onEdit: (category: Category) => void;
  onArchive: (category: Category) => void;
}) {
  const presentation = categoryPresentation(category);
  const stats = usage.get(category.id);
  const isIncome = category.type === "income";

  return (
    <div className={cn("cgx-card", !category.isActive && "cgx-card-archived")}>
      <div className="cgx-card-head">
        <span
          className="cgx-card-icon"
          style={{
            background: `color-mix(in srgb, ${presentation.color} 15%, transparent)`,
            color: presentation.color,
          }}
        >
          <presentation.Icon aria-hidden="true" size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{category.name}</strong>
          <span>
            {category.isActive
              ? `${stats?.count ?? 0} ${(stats?.count ?? 0) === 1 ? "lançamento" : "lançamentos"} no mês`
              : "Arquivada"}
          </span>
        </div>
      </div>
      <div className="cgx-card-foot">
        <span className={cn("cgx-card-total", isIncome && "cgx-card-total-income")}>
          {isIncome ? "+ " : ""}
          {formatCurrency(stats?.total ?? 0)}
          <small> /mês</small>
        </span>
        {category.isActive ? (
          <div className="cgx-card-actions">
            <button
              aria-label={`Editar ${category.name}`}
              onClick={() => onEdit(category)}
              title="Editar"
              type="button"
            >
              <Pencil aria-hidden="true" size={14} />
            </button>
            <button
              aria-label={`Arquivar ${category.name}`}
              className="cgx-action-danger"
              onClick={() => onArchive(category)}
              title="Arquivar"
              type="button"
            >
              <Archive aria-hidden="true" size={14} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CategoriesScreen() {
  const [tab, setTab] = useState<TypeTab>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [archiving, setArchiving] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const { query: search } = useGlobalSearch();
  const queryClient = useQueryClient();

  const categories = useCategories({ status: showArchived ? "all" : "active", type: "all" });
  const monthTransactions = useTransactions(
    toListParams({
      month: currentMonthValue(),
      type: "",
      accountId: "",
      categoryId: "",
      paymentMethod: "",
      source: "",
    }),
  );

  const usage = useMemo(() => buildUsage(monthTransactions.data ?? []), [monthTransactions.data]);

  useEffect(() => {
    function openCreate() {
      setEditing(null);
      setDrawerOpen(true);
    }
    window.addEventListener("fluxtrackr:new-category", openCreate);
    return () => window.removeEventListener("fluxtrackr:new-category", openCreate);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const archiveMutation = useMutation({
    mutationFn: async (category: Category) => archiveCategoryData(category.id),
    onSuccess: async () => {
      await Promise.all(
        [["categories"], ["transaction-categories"], ["planning-categories"], ["category-budget-overview"]].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      );
      setArchiving(null);
      setFeedback("Categoria arquivada.");
    },
    onError: (mutationError) => setArchiveError(getCategoryErrorMessage(mutationError)),
  });

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      (categories.data ?? []).filter((category) =>
        term ? category.name.toLowerCase().includes(term) : true,
      ),
    [categories.data, term],
  );
  const expenseCategories = visible.filter((category) => category.type !== "income");
  const incomeCategories = visible.filter((category) => category.type !== "expense");

  function openEdit(category: Category) {
    setFeedback(null);
    setEditing(category);
    setDrawerOpen(true);
  }

  const sections: Array<{
    key: TypeTab;
    title: string;
    icon: React.ReactNode;
    items: Category[];
  }> = [
    {
      key: "expense",
      title: "Despesas",
      icon: <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />,
      items: expenseCategories,
    },
    {
      key: "income",
      title: "Receitas",
      icon: <TrendingUp aria-hidden="true" color="var(--green-strong)" size={15} />,
      items: incomeCategories,
    },
  ];

  return (
    <section className="cgx-screen" aria-label="Categorias">
      <div className="cgx-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="tlx-view-switch" role="group" aria-label="Filtrar por tipo">
            <button aria-pressed={tab === "all"} onClick={() => setTab("all")} type="button">
              Todas
            </button>
            <button aria-pressed={tab === "expense"} onClick={() => setTab("expense")} type="button">
              Despesas
            </button>
            <button aria-pressed={tab === "income"} onClick={() => setTab("income")} type="button">
              Receitas
            </button>
          </div>
          <button
            aria-pressed={showArchived}
            className={cn("txx-chip txx-chip-ghost", showArchived && "txx-chip-active")}
            onClick={() => setShowArchived((value) => !value)}
            type="button"
          >
            <Archive aria-hidden="true" size={14} />
            Mostrar arquivadas
          </button>
        </div>
        <span className="cgx-count">
          {visible.length} {visible.length === 1 ? "categoria" : "categorias"}
        </span>
      </div>

      <div className="cgx-body">
        <div className="cgx-main">
          {feedback ? (
            <p className="mutation-feedback" role="status" style={{ marginBottom: 12 }}>
              {feedback}
            </p>
          ) : null}

          {categories.isPending ? (
            <div aria-busy="true" aria-label="Carregando categorias" className="cgx-skeleton" role="status">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {categories.isError && !categories.data ? (
            <div className="tlx-state" role="alert">
              <div>
                <span className="tlx-state-icon tlx-tone-red">
                  <TriangleAlert aria-hidden="true" size={24} />
                </span>
                <strong>Falha ao carregar categorias</strong>
                <p>Verifique a conexão e tente novamente.</p>
                <button
                  className="tlx-state-retry"
                  onClick={() => categories.refetch({ cancelRefetch: false })}
                  type="button"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : null}

          {categories.data ? (
            visible.length === 0 ? (
              <div className="tlx-state">
                <div>
                  <span className="tlx-state-icon tlx-tone-green">
                    <Tag aria-hidden="true" size={24} />
                  </span>
                  <strong>Nenhuma categoria encontrada</strong>
                  <p>Crie categorias para organizar suas receitas e despesas.</p>
                  <button
                    className="tlx-state-cta"
                    onClick={() => {
                      setEditing(null);
                      setDrawerOpen(true);
                    }}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
                    Nova categoria
                  </button>
                </div>
              </div>
            ) : (
              sections
                .filter((section) => tab === "all" || tab === section.key)
                .map((section) =>
                  section.items.length === 0 ? null : (
                    <div key={section.key}>
                      <div className="cgx-section-head">
                        {section.icon}
                        <strong>{section.title}</strong>
                        <span>{section.items.length}</span>
                      </div>
                      <div className="cgx-grid">
                        {section.items.map((category) => (
                          <CategoryCard
                            category={category}
                            key={category.id}
                            onArchive={(target) => {
                              setArchiveError(null);
                              setArchiving(target);
                            }}
                            onEdit={openEdit}
                            usage={usage}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )
            )
          ) : null}
        </div>

        <CategoriesRail categories={categories.data ?? []} usage={usage} />
      </div>

      <CategoryDrawer
        editing={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={(message) => {
          setDrawerOpen(false);
          setEditing(null);
          setFeedback(message);
        }}
        open={drawerOpen}
      />

      <Dialog
        busy={archiveMutation.isPending}
        description={
          archiving
            ? `Arquivar "${archiving.name}"? Os lançamentos existentes são preservados e os orçamentos ativos vinculados também serão arquivados.`
            : ""
        }
        descriptionId="archive-category-description"
        onClose={() => setArchiving(null)}
        open={archiving !== null}
        title="Arquivar categoria?"
        titleId="archive-category-title"
      >
        {archiveError ? (
          <p className="txx-form-error" role="alert">
            {archiveError}
          </p>
        ) : null}
        <div className="txx-drawer-foot" style={{ padding: "16px 0 0", borderTop: 0 }}>
          <button
            className="txx-drawer-cancel"
            disabled={archiveMutation.isPending}
            onClick={() => setArchiving(null)}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="txx-drawer-save"
            disabled={archiveMutation.isPending}
            onClick={() => archiving && archiveMutation.mutate(archiving)}
            style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
            type="button"
          >
            {archiveMutation.isPending ? "Arquivando…" : "Arquivar"}
          </button>
        </div>
      </Dialog>
    </section>
  );
}
