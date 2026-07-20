import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/wallet/lib/wallet-period", () => ({
  getCurrentUtcWalletPeriod: vi.fn(),
}));

import { useCurrentWalletPeriod } from "@/features/wallet/hooks/use-current-wallet-period";
import { getCurrentUtcWalletPeriod } from "@/features/wallet/lib/wallet-period";

const december = { year: 2025, month: 12 };
const january = { year: 2026, month: 1 };

afterEach(() => {
  vi.resetAllMocks();
});

describe("useCurrentWalletPeriod", () => {
  it("recalculates the period when the window regains focus (December to January)", () => {
    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(december);
    const { result } = renderHook(() => useCurrentWalletPeriod());
    expect(result.current.period).toEqual(december);

    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(january);
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(result.current.period).toEqual(january);
  });

  it("recalculates the period on visibilitychange when visible", () => {
    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(december);
    const { result } = renderHook(() => useCurrentWalletPeriod());

    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(january);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(result.current.period).toEqual(january);
  });

  it("does not create a new period reference when nothing changed", () => {
    vi.mocked(getCurrentUtcWalletPeriod).mockImplementation(() => ({ year: 2026, month: 7 }));
    const { result } = renderHook(() => useCurrentWalletPeriod());
    const initialPeriod = result.current.period;

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(result.current.period).toBe(initialPeriod);
  });

  it("returns the freshly computed period and changed flag from a manual refresh", () => {
    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(december);
    const { result } = renderHook(() => useCurrentWalletPeriod());

    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(january);
    let refreshed: { period: { year: number; month: number }; changed: boolean } | undefined;
    act(() => {
      refreshed = result.current.refreshPeriod();
    });

    expect(refreshed).toEqual({ period: january, changed: true });
    expect(result.current.period).toEqual(january);
  });

  it("returns the current period reference and changed=false when the month is unchanged", () => {
    vi.mocked(getCurrentUtcWalletPeriod).mockReturnValue(december);
    const { result } = renderHook(() => useCurrentWalletPeriod());
    const initialPeriod = result.current.period;

    let refreshed: { period: { year: number; month: number }; changed: boolean } | undefined;
    act(() => {
      refreshed = result.current.refreshPeriod();
    });

    expect(refreshed).toEqual({ period: initialPeriod, changed: false });
    expect(refreshed?.period).toBe(initialPeriod);
  });
});
