import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NewMovementDialog } from "@/features/transactions/components/new-movement-dialog";

afterEach(cleanup);

describe("NewMovementDialog", () => {
  it("offers the four movement kinds, explains a disabled transfer and focuses the first choice", async () => {
    const onClose = vi.fn();
    render(<NewMovementDialog canTransfer={false} onClose={onClose} onSelect={vi.fn()} open />);

    const expense = screen.getByRole("button", { name: /^Despesa/ });
    expect(screen.getByRole("button", { name: /^Receita/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^Transferência/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Compra no cartão/ })).toBeEnabled();
    expect(screen.getByText("Crie pelo menos duas contas ativas para fazer uma transferência.")).toBeInTheDocument();

    await waitFor(() => expect(document.activeElement).toBe(expense));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns the selected kind when transfer is available", () => {
    const onSelect = vi.fn();
    render(<NewMovementDialog canTransfer onClose={vi.fn()} onSelect={onSelect} open />);

    fireEvent.click(screen.getByRole("button", { name: /^Transferência/ }));

    expect(onSelect).toHaveBeenCalledWith("transfer");
  });
});
