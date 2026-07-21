import { Plus } from "lucide-react";

import type { Category } from "@/api/generated/client";

type CategoriesWithoutBudgetProps = {
  categories: Category[];
  onDefineBudget: (category: Category) => void;
};

export function CategoriesWithoutBudget({ categories, onDefineBudget }: CategoriesWithoutBudgetProps) {
  return (
    <section aria-labelledby="planning-categories-without-budget-title" className="planning-categories-without-budget">
      <div className="planning-section-heading">
        <div>
          <p className="planning-section-eyebrow">Próximo passo</p>
          <h2 id="planning-categories-without-budget-title">Categorias sem orçamento</h2>
        </div>
        <p>{categories.length} disponível(is)</p>
      </div>

      {categories.length === 0 ? (
        <p className="planning-section-empty">Todas as categorias elegíveis já têm orçamento neste período.</p>
      ) : (
        <ul className="planning-category-without-budget-list">
          {categories.map((category) => (
            <li key={category.id}>
              <div>
                <strong>{category.name}</strong>
                <span>{category.type === "both" ? "Receita e despesa" : "Despesa"}</span>
              </div>
              <button className="secondary-button" onClick={() => onDefineBudget(category)} type="button">
                <Plus aria-hidden="true" size={15} />
                Definir orçamento
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
