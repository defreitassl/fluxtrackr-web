"use client";

import { ShieldCheck, Tag, TriangleAlert } from "lucide-react";

import type { Category } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";

export type CategoryUsage = Map<string, { count: number; total: number }>;

type CategoriesRailProps = {
  categories: Category[];
  usage: CategoryUsage;
};

export function CategoriesRail({ categories, usage }: CategoriesRailProps) {
  const active = categories.filter((category) => category.isActive);
  const expenseCount = active.filter((category) => category.type !== "income").length;
  const incomeCount = active.filter((category) => category.type !== "expense").length;

  const mostUsed = active
    .map((category) => ({ category, count: usage.get(category.id)?.count ?? 0 }))
    .sort((left, right) => right.count - left.count)[0];
  const mostUsedPresentation = mostUsed?.category ? categoryPresentation(mostUsed.category) : null;

  return (
    <aside className="cgx-rail" aria-label="Resumo das categorias">
      <div className="cgx-rail-card">
        <div className="tlx-card-title">
          <Tag aria-hidden="true" size={15} />
          Resumo
        </div>
        <div className="cgx-rail-tiles">
          <div>
            <span>Despesas</span>
            <strong>{expenseCount}</strong>
          </div>
          <div>
            <span>Receitas</span>
            <strong>{incomeCount}</strong>
          </div>
        </div>
        {mostUsed && mostUsed.count > 0 && mostUsedPresentation ? (
          <div className="cgx-most-used">
            <span
              style={{
                background: `color-mix(in srgb, ${mostUsedPresentation.color} 15%, transparent)`,
                color: mostUsedPresentation.color,
              }}
            >
              <mostUsedPresentation.Icon aria-hidden="true" size={15} />
            </span>
            <div className="cgx-most-used-info">
              <span>Mais usada no mês</span>
              <strong>
                {mostUsed.category.name} · {mostUsed.count}{" "}
                {mostUsed.count === 1 ? "lançamento" : "lançamentos"}
              </strong>
            </div>
          </div>
        ) : null}
      </div>

      <div className="cgx-info-card">
        <div className="cgx-info-card-head">
          <span>
            <ShieldCheck aria-hidden="true" size={15} />
          </span>
          <strong>Métodos são fixos</strong>
        </div>
        <p>
          Pix, débito, crédito, dinheiro, transferência e boleto são{" "}
          <strong>métodos de pagamento</strong> do sistema — não são categorias e não podem ser
          editados aqui.
        </p>
      </div>

      <div className="cgx-note-card">
        <TriangleAlert aria-hidden="true" color="var(--amber)" size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
        <p>
          Ao arquivar uma categoria, os lançamentos existentes <strong>são preservados</strong> e os
          orçamentos ativos vinculados também são arquivados. Ela apenas deixa de aparecer para novos
          lançamentos.
        </p>
      </div>
    </aside>
  );
}
