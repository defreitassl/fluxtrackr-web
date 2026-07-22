import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/categories/queries/use-categories", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/categories/queries/use-categories")>()),
  useCategories: vi.fn(),
}));

vi.mock("@/features/transactions/queries/use-transactions", () => ({
  useTransactions: vi.fn().mockReturnValue({ data: [], isPending: false }),
}));

vi.mock("@/features/categories/api/categories", () => ({
  createCategoryData: vi.fn(),
  updateCategoryData: vi.fn(),
  archiveCategoryData: vi.fn().mockResolvedValue({ archived: true }),
}));

import { CategoriesScreen } from "@/features/categories/categories-screen";
import { archiveCategoryData } from "@/features/categories/api/categories";
import { useCategories } from "@/features/categories/queries/use-categories";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
import { SearchProvider } from "@/providers/search-provider";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SearchProvider>{children}</SearchProvider>
    </QueryClientProvider>
  );
}

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: "category-1",
  userId: "user-1",
  name: "Alimentação",
  type: "expense",
  isActive: true,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  ...overrides,
});

function mockCategories(state: Record<string, unknown>) {
  vi.mocked(useCategories).mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
    ...state,
  } as never);
}

describe("CategoriesScreen", () => {
  it("shows the shimmer skeleton while pending", () => {
    mockCategories({ isPending: true });

    render(<CategoriesScreen />, { wrapper });

    expect(screen.getByRole("status", { name: "Carregando categorias" })).toBeInTheDocument();
  });

  it("shows the error state on failure", () => {
    mockCategories({ isError: true });

    render(<CategoriesScreen />, { wrapper });

    expect(screen.getByText("Falha ao carregar categorias")).toBeInTheDocument();
  });

  it("renders sections with usage computed from month transactions", () => {
    mockCategories({
      data: [
        makeCategory(),
        makeCategory({ id: "category-2", name: "Salário", type: "income" }),
      ],
    });
    vi.mocked(useTransactions).mockReturnValue({
      data: [
        { id: "t1", categoryId: "category-1", amount: "100.00", type: "expense" },
        { id: "t2", categoryId: "category-1", amount: "42.70", type: "expense" },
      ],
      isPending: false,
    } as never);

    render(<CategoriesScreen />, { wrapper });

    expect(screen.getByText("Despesas", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("Receitas", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("2 lançamentos no mês")).toBeInTheDocument();
    expect(screen.getByText(/142,70/)).toBeInTheDocument();
    expect(screen.getByText(/Alimentação · 2 lançamentos/)).toBeInTheDocument();
    expect(screen.getByText("2 categorias")).toBeInTheDocument();
  });

  it("filters by type tab", () => {
    mockCategories({
      data: [
        makeCategory(),
        makeCategory({ id: "category-2", name: "Salário", type: "income" }),
      ],
    });

    render(<CategoriesScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Receitas" }));

    expect(screen.queryByText("Alimentação")).not.toBeInTheDocument();
    expect(screen.getByText("Salário")).toBeInTheDocument();
  });

  it("opens the drawer with a live preview when editing", () => {
    mockCategories({ data: [makeCategory()] });

    render(<CategoriesScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Editar Alimentação" }));

    const drawer = screen.getByRole("dialog", { name: "Editar categoria" });
    expect(within(drawer).getByDisplayValue("Alimentação")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Despesa" })).toHaveAttribute("aria-pressed", "true");
  });

  it("archives a category after confirmation", async () => {
    mockCategories({ data: [makeCategory()] });

    render(<CategoriesScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Arquivar Alimentação" }));
    const dialog = screen.getByRole("dialog", { name: "Arquivar categoria?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Arquivar" }));

    expect(await screen.findByText("Categoria arquivada.")).toBeInTheDocument();
    expect(archiveCategoryData).toHaveBeenCalledWith("category-1");
  });
});
