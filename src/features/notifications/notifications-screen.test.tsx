import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/notifications/queries/use-notification-feeds", () => ({
  useNotificationsFeed: vi.fn(),
  useActivitiesFeed: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useDismissNotification: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
  useNotificationPreferences: vi.fn().mockReturnValue({ data: undefined, isPending: false, isError: false }),
  useUpdateNotificationPreferences: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/api/generated/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/generated/client")>()),
  getUnreadNotificationsCount: vi
    .fn()
    .mockResolvedValue({ status: 200, data: { unreadCount: 2 }, headers: new Headers() }),
}));

import { NotificationsScreen } from "@/features/notifications/notifications-screen";
import {
  useActivitiesFeed,
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsFeed,
} from "@/features/notifications/queries/use-notification-feeds";
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

const notification = {
  id: "notification-1",
  userId: "user-1",
  category: "invoices",
  type: "invoice_due_soon",
  severity: "warning",
  title: "Fatura Cartão Flux vence em 3 dias",
  message: "A fatura de julho está aberta no valor de R$ 240,00.",
  sourceType: "credit_card_invoice",
  sourceId: "invoice-1",
  dedupeKey: "key",
  scheduledFor: null,
  readAt: null,
  dismissedAt: null,
  resolvedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const activity = {
  id: "activity-1",
  userId: "user-1",
  type: "transaction_created",
  entityType: "transaction",
  entityId: "transaction-1",
  title: "Despesa criada",
  description: "Jantar • R$ 45,90",
  metadata: null,
  occurredAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

function mockFeeds({
  notifications = [notification],
  activities = [activity],
}: { notifications?: unknown[]; activities?: unknown[] } = {}) {
  vi.mocked(useNotificationsFeed).mockReturnValue({
    data: { pages: [{ items: notifications, nextCursor: null }] },
    isPending: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  } as never);
  vi.mocked(useActivitiesFeed).mockReturnValue({
    data: { pages: [{ items: activities, nextCursor: "cursor-2" }] },
    isPending: false,
    isError: false,
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  } as never);
  const markRead = { mutate: vi.fn() };
  const dismiss = { mutate: vi.fn() };
  vi.mocked(useMarkNotificationRead).mockReturnValue(markRead as never);
  vi.mocked(useDismissNotification).mockReturnValue(dismiss as never);
  vi.mocked(useMarkAllNotificationsRead).mockReturnValue({ mutate: vi.fn() } as never);
  return { markRead, dismiss };
}

describe("NotificationsScreen", () => {
  it("renders grouped notifications with severity pill and unread state", () => {
    mockFeeds();

    render(<NotificationsScreen />, { wrapper });

    expect(screen.getByText("Hoje")).toBeInTheDocument();
    expect(screen.getByText("Fatura Cartão Flux vence em 3 dias")).toBeInTheDocument();
    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(screen.getByText("1 notificação")).toBeInTheDocument();
  });

  it("dismisses a notification from the hover action", () => {
    const { dismiss } = mockFeeds();

    render(<NotificationsScreen />, { wrapper });

    fireEvent.click(
      screen.getByRole("button", { name: 'Dispensar "Fatura Cartão Flux vence em 3 dias"' }),
    );

    expect(dismiss.mutate).toHaveBeenCalledWith("notification-1", expect.anything());
  });

  it("marks an unread notification as read from the hover action", () => {
    const { markRead } = mockFeeds();

    render(<NotificationsScreen />, { wrapper });

    fireEvent.click(
      screen.getByRole("button", { name: 'Marcar "Fatura Cartão Flux vence em 3 dias" como lida' }),
    );

    expect(markRead.mutate).toHaveBeenCalledWith("notification-1", expect.anything());
  });

  it("switches to the activities tab with load-more control", () => {
    mockFeeds();

    render(<NotificationsScreen />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: "Atividades" }));

    expect(screen.getByText("Despesa criada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carregar mais/ })).toBeInTheDocument();
    expect(screen.getByText("1 atividade")).toBeInTheDocument();
  });

  it("shows the empty state when there are no notifications", () => {
    mockFeeds({ notifications: [] });

    render(<NotificationsScreen />, { wrapper });

    expect(screen.getByText(/Nenhuma notificação encontrada/)).toBeInTheDocument();
  });
});
