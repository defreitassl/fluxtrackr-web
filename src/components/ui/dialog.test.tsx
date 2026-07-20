import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog } from "@/components/ui/dialog";

afterEach(cleanup);

function DialogHarness({ busy = false, initialFocusSelector }: { busy?: boolean; initialFocusSelector?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        Abrir
      </button>
      <button type="button">Fora</button>
      <Dialog
        busy={busy}
        initialFocusSelector={initialFocusSelector}
        onClose={() => setOpen(false)}
        open={open}
        title="Exemplo"
        titleId="dialog-title"
      >
        <button id="initial-target" type="button">
          Primeiro campo
        </button>
        <button type="button">Último campo</button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("honors explicit initial focus and restores the trigger", () => {
    render(<DialogHarness initialFocusSelector="#initial-target" />);
    const trigger = screen.getByRole("button", { name: "Abrir" });

    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "Primeiro campo" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("uses the first non-close control as fallback and traps Tab from outside", () => {
    render(<DialogHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

    const first = screen.getByRole("button", { name: "Primeiro campo" });
    const last = screen.getByRole("button", { name: "Último campo" });
    const close = screen.getByRole("button", { name: "Fechar" });
    expect(first).toHaveFocus();

    screen.getByRole("button", { name: "Fora" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("does not close through Escape or overlay while busy", () => {
    render(<DialogHarness busy initialFocusSelector="#initial-target" />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
