import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionDetailsDialog } from "@/features/transactions/components/transaction-details-dialog";

const transaction = {
  id: "transaction-1",
  userId: "user-1",
  type: "expense",
  amount: "87.50",
  description: "Mercado histórico",
  categoryId: "archived-category",
  accountId: "missing-account",
  paymentMethod: "credit",
  occurredAt: "2026-07-20T15:30:00.000Z",
  source: "telegram",
  createdAt: "2026-07-19T10:00:00.000Z",
  updatedAt: "2026-07-19T10:00:00.000Z",
} as never;

afterEach(cleanup);

describe("TransactionDetailsDialog", () => {
  it("identifies historical references, payment method, Telegram source and UTC dates", async () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <TransactionDetailsDialog
        accountsById={new Map()}
        categoriesById={new Map([["archived-category", { id: "archived-category", name: "Categoria histórica", isActive: false } as never]])}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        transaction={transaction}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Detalhe da transação" })).toHaveTextContent("Mercado histórico");
    expect(screen.getByText("Categoria histórica · Arquivada")).toBeInTheDocument();
    expect(screen.getByText("Conta arquivada ou indisponível")).toBeInTheDocument();
    expect(screen.getByText("Crédito")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getAllByText(/UTC/).length).toBeGreaterThan(0);

    const editButton = screen.getByRole("button", { name: "Editar" });
    await waitFor(() => expect(document.activeElement).toBe(editButton));
    fireEvent.click(editButton);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onEdit).toHaveBeenCalledWith(transaction);
    expect(onDelete).toHaveBeenCalledWith(transaction);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
