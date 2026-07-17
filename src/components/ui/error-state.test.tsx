import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState", () => {
  it("retries when user chooses Tentar novamente", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
