import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/ui/page-header";

describe("PageHeader", () => {
  it("applies the supplied title ID to its heading", () => {
    render(<PageHeader description="Descrição" eyebrow="Área" title="Título" titleId="screen-title" />);

    expect(screen.getByRole("heading", { name: "Título" })).toHaveAttribute("id", "screen-title");
  });

  it("remains compatible when no title ID is supplied", () => {
    const { container } = render(<PageHeader description="Descrição" eyebrow="Área" title="Título" />);

    expect(container.querySelector("h1")).not.toHaveAttribute("id");
  });
});
