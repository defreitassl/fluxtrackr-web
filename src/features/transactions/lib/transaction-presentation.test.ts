import { describe, expect, it } from "vitest";

import {
  transactionAccountLabel,
  transactionCategoryLabel,
  transactionSourceLabel,
} from "@/features/transactions/lib/transaction-presentation";

describe("transactionAccountLabel", () => {
  it("distinguishes a missing account from an unavailable historical account", () => {
    const activeAccounts = new Map();

    expect(transactionAccountLabel(null, activeAccounts)).toBe("Sem conta");
    expect(transactionAccountLabel("archived-account", activeAccounts)).toBe("Conta arquivada ou indisponível");
  });

  it("marks archived categories and exposes Telegram as the source", () => {
    const categories = new Map([
      ["archived-category", { id: "archived-category", name: "Mercado", isActive: false }],
    ]) as never;

    expect(transactionCategoryLabel(null, categories)).toBe("Sem categoria");
    expect(transactionCategoryLabel("archived-category", categories)).toBe("Mercado · Arquivada");
    expect(transactionCategoryLabel("missing-category", categories)).toBe("Categoria arquivada ou indisponível");
    expect(transactionSourceLabel("telegram")).toBe("Telegram");
    expect(transactionSourceLabel("app")).toBe("Aplicativo");
  });
});
