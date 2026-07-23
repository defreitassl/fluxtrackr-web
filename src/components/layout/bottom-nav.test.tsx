import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock, pushMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(() => "/dashboard"),
  pushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/features/dashboard/queries/use-dashboard-overview", () => ({
  useDashboardOverview: vi.fn(),
}));

vi.mock("@/features/notifications/queries/use-unread-notifications-count", () => ({
  useUnreadNotificationsCount: vi.fn(),
}));

import { BottomNav } from "@/components/layout/bottom-nav";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { useUnreadNotificationsCount } from "@/features/notifications/queries/use-unread-notifications-count";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  pathnameMock.mockReturnValue("/dashboard");
  vi.mocked(useDashboardOverview).mockReturnValue({
    data: {
      upcomingCommitments: [{ sourceType: "financial_event" }, { sourceType: "fixed_expense" }],
      budgetSummary: { nearLimitCount: 1, exceededCount: 1 },
    },
  } as never);
  vi.mocked(useUnreadNotificationsCount).mockReturnValue({ data: { unreadCount: 3 } } as never);
});

describe("BottomNav", () => {
  it("renders the five mobile navigation slots and marks the current route", () => {
    pathnameMock.mockReturnValue("/timeline");

    render(<BottomNav />);

    expect(screen.getByRole("navigation", { name: "Navegação móvel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Timeline/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Nova movimentação" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Carteira" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mais" })).toBeInTheDocument();
  });

  it("dispatches the exact contextual event used by the header", () => {
    const listener = vi.fn();
    pathnameMock.mockReturnValue("/events");
    window.addEventListener("fluxtrackr:new-event", listener);

    render(<BottomNav />);
    fireEvent.click(screen.getByRole("button", { name: "Novo evento" }));

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("fluxtrackr:new-event", listener);
  });

  it("falls back to transactions when the current route has no contextual CTA", () => {
    render(<BottomNav />);

    fireEvent.click(screen.getByRole("button", { name: "Nova movimentação" }));

    expect(pushMock).toHaveBeenCalledWith("/transactions");
  });

  it("opens the more sheet with badges and closes it with Escape", () => {
    render(<BottomNav />);

    const trigger = screen.getByRole("button", { name: "Mais" });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Mais opções" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Eventos, 1 pendência" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejamento, 2 pendências" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notificações, 3 pendências" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Mais opções" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes the sheet when the route changes", async () => {
    const { rerender } = render(<BottomNav />);
    fireEvent.click(screen.getByRole("button", { name: "Mais" }));
    expect(screen.getByRole("dialog", { name: "Mais opções" })).toBeInTheDocument();

    pathnameMock.mockReturnValue("/wallet");
    rerender(<BottomNav />);

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Mais opções" })).not.toBeInTheDocument();
    });
  });
});
