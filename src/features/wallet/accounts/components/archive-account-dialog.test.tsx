import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("@/features/wallet/accounts/mutations/use-archive-account", () => ({
  useArchiveAccount: vi.fn().mockReturnValue({ isPending: false, mutateAsync }),
}));

import { ArchiveAccountDialog } from "@/features/wallet/accounts/components/archive-account-dialog";

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe("ArchiveAccountDialog", () => {
  it("warns that history is preserved and archives the selected account", () => {
    const onArchived = vi.fn();
    render(
      <ArchiveAccountDialog
        account={{ account: { id: "account-1", name: "Nubank" }, balance: { currentBalance: "2600.00" } } as never}
        onArchived={onArchived}
        onClose={vi.fn()}
        open
      />,
      { wrapper },
    );

    expect(screen.getByRole("dialog", { name: "Arquivar conta" })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent?.includes("histórico de transferências, ajustes e movimentações serão preservados.") === true)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Arquivar conta" }));
    expect(mutateAsync).toHaveBeenCalledWith("account-1");
  });
});
