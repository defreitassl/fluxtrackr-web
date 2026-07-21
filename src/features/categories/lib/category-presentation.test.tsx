import { CategoryType } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { describe, expect, it } from "vitest";

describe("categoryPresentation", () => {
  it("uses a stable presentation derived from the category ID", () => {
    const category = { id: "category-1", name: "Alimentação", type: CategoryType.expense };

    expect(categoryPresentation(category)).toEqual(categoryPresentation(category));
  });

  it("recognizes known names independently from accents", () => {
    const withAccent = categoryPresentation({ id: "a", name: "Alimentação", type: CategoryType.expense });
    const withoutAccent = categoryPresentation({ id: "b", name: "Alimentacao", type: CategoryType.expense });

    expect(withAccent.Icon).toBe(withoutAccent.Icon);
  });
});
