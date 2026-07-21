import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/categories/api/categories", () => ({
  archiveCategoryData: vi.fn(),
  createCategoryData: vi.fn(),
  updateCategoryData: vi.fn(),
}));

vi.mock("@/features/categories/queries/use-categories", () => ({
  useCategories: vi.fn(),
}));

import {
  archiveCategoryData,
  createCategoryData,
  updateCategoryData,
} from "@/features/categories/api/categories";
import { CategoriesScreen } from "@/features/categories/categories-screen";
import { useCategories } from "@/features/categories/queries/use-categories";
import { ApiError } from "@/lib/http";

const category = {
  id: "category-1",
  userId: "user-1",
  name: "Alimentação",
  type: "expense" as const,
  isActive: true,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function mockCategories(overrides: Record<string, unknown> = {}) {
  const refetch = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useCategories).mockReturnValue({
    data: [category],
    isError: false,
    isFetching: false,
    isPending: false,
    isRefetchError: false,
    refetch,
    ...overrides,
  } as never);
  return refetch;
}

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  const invalidateQueries = vi.spyOn(client, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={client}>
      <CategoriesScreen />
    </QueryClientProvider>,
  );
  return { ...view, invalidateQueries };
}

function openCreateDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Nova categoria" }));
  return screen.getByRole("dialog", { name: "Nova categoria" });
}

describe("CategoriesScreen", () => {
  it("shows the initial loading state", () => {
    mockCategories({ data: undefined, isPending: true });
    renderScreen();

    expect(screen.getByLabelText("Carregando categorias")).toBeInTheDocument();
  });

  it("shows and retries an initial loading error", () => {
    const refetch = mockCategories({ data: undefined, isError: true });
    renderScreen();

    expect(screen.getByRole("alert")).toHaveTextContent("Categorias indisponíveis");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it("shows the empty state for the default active-category filter", () => {
    mockCategories({ data: [] });
    renderScreen();

    expect(screen.getByRole("heading", { name: "Nenhuma categoria ativa foi encontrada." })).toBeInTheDocument();
    expect(screen.getByText("Crie a primeira categoria para classificar seus lançamentos.")).toBeInTheDocument();
  });

  it("keeps previous data visible and retries after a refetch error", () => {
    const refetch = mockCategories({ isError: true, isRefetchError: true });
    renderScreen();

    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Os dados exibidos podem estar desatualizados.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it("passes status and type filters to the categories query", async () => {
    mockCategories();
    renderScreen();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "archived" } });
    await waitFor(() =>
      expect(vi.mocked(useCategories).mock.calls.at(-1)?.[0]).toEqual({ status: "archived", type: "all" }),
    );

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "both" } });
    await waitFor(() =>
      expect(vi.mocked(useCategories).mock.calls.at(-1)?.[0]).toEqual({ status: "archived", type: "both" }),
    );
  });

  it("creates a category, invalidates the list, and shows feedback", async () => {
    mockCategories();
    vi.mocked(createCategoryData).mockResolvedValue({ ...category, id: "category-2", name: "Mercado", type: "both" });
    const { invalidateQueries } = renderScreen();

    const dialog = openCreateDialog();
    fireEvent.change(within(dialog).getByLabelText("Nome"), { target: { value: " Mercado " } });
    fireEvent.change(within(dialog).getByLabelText("Tipo"), { target: { value: "both" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(createCategoryData).toHaveBeenCalledWith({ name: "Mercado", type: "both" }),
    );
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Categoria criada com sucesso.");
    expect(screen.queryByRole("dialog", { name: "Nova categoria" })).not.toBeInTheDocument();
  });

  it("edits a category with prefilled values and invalidates the list", async () => {
    mockCategories();
    vi.mocked(updateCategoryData).mockResolvedValue({ ...category, name: "Mercado", type: "both" });
    const { invalidateQueries } = renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Editar Alimentação" }));
    const dialog = screen.getByRole("dialog", { name: "Editar categoria" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Nome")).toHaveValue("Alimentação");
    fireEvent.change(within(dialog).getByLabelText("Nome"), { target: { value: " Mercado " } });
    fireEvent.change(within(dialog).getByLabelText("Tipo"), { target: { value: "both" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(updateCategoryData).toHaveBeenCalledWith("category-1", { name: "Mercado", type: "both" }),
    );
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Categoria atualizada com sucesso.");
  });

  it("requires confirmation before archiving and invalidates after success", async () => {
    mockCategories();
    vi.mocked(archiveCategoryData).mockResolvedValue({ archived: true });
    const { invalidateQueries } = renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Arquivar Alimentação" }));
    expect(screen.getByRole("dialog", { name: "Arquivar esta categoria?" })).toHaveTextContent(
      "Orçamentos ativos vinculados também serão arquivados.",
    );
    expect(archiveCategoryData).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Arquivar categoria" }));
    await waitFor(() => expect(archiveCategoryData).toHaveBeenCalledWith("category-1"));
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Categoria arquivada com sucesso.");
    expect(screen.queryByRole("dialog", { name: "Arquivar esta categoria?" })).not.toBeInTheDocument();
  });

  for (const [status, message] of [
    [400, "Verifique os dados da categoria e tente novamente."],
    [404, "A categoria não foi encontrada. Atualize a lista e tente novamente."],
    [409, "Já existe uma categoria com esse nome ou há um orçamento ativo incompatível."],
    [503, "Serviço indisponível. Tente novamente."],
  ] as const) {
    it(`maps a ${status} create error without closing the dialog`, async () => {
      mockCategories();
      vi.mocked(createCategoryData).mockRejectedValue(new ApiError(status, {}));
      const { invalidateQueries } = renderScreen();

      const dialog = openCreateDialog();
      fireEvent.change(within(dialog).getByLabelText("Nome"), { target: { value: "Mercado" } });
      fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.getByRole("dialog", { name: "Nova categoria" })).toBeInTheDocument();
      expect(invalidateQueries).not.toHaveBeenCalled();
    });
  }
});
