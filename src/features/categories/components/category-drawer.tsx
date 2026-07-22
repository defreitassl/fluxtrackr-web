"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

import type { Category, CategoryType } from "@/api/generated/client";
import { createCategoryData, updateCategoryData } from "@/features/categories/api/categories";
import {
  categoryFormSchema,
  getCategoryErrorMessage,
  toCreateCategoryPayload,
  toUpdateCategoryPayload,
} from "@/features/categories/lib/category-form";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { cn } from "@/lib/cn";

type CategoryDrawerProps = {
  open: boolean;
  editing: Category | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

const typeTabs: Array<{ value: CategoryType; label: string; className: string }> = [
  { value: "expense", label: "Despesa", className: "txx-type-expense" },
  { value: "income", label: "Receita", className: "txx-type-income" },
  { value: "both", label: "Ambas", className: "txx-type-transfer" },
];

export function CategoryDrawer({ open, editing, onClose, onSaved }: CategoryDrawerProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [error, setError] = useState<string | null>(null);

  // Reinicia o formulário quando o drawer abre (ajuste de estado no render).
  const session = open ? (editing?.id ?? "new") : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    if (session !== null) {
      setError(null);
      setName(editing?.name ?? "");
      setType(editing?.type ?? "expense");
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = categoryFormSchema.safeParse({ name, type });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Verifique os dados da categoria.");
      }
      if (editing) {
        await updateCategoryData(editing.id, toUpdateCategoryPayload(parsed.data));
        return "Categoria atualizada.";
      }
      await createCategoryData(toCreateCategoryPayload(parsed.data));
      return "Categoria criada.";
    },
    onSuccess: async (message) => {
      await Promise.all(
        [["categories"], ["transaction-categories"], ["planning-categories"]].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      onSaved(message);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error && mutationError.message.length < 120
          ? mutationError.message
          : getCategoryErrorMessage(mutationError),
      );
    },
  });

  // Preview ao vivo: ícone/cor derivados do nome digitado (mesma regra usada
  // em toda a aplicação — a API não armazena ícone/cor de categoria).
  const preview = categoryPresentation({ id: editing?.id ?? "draft", name: name || "Categoria", type });

  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={onClose} />
      <aside
        aria-hidden={!open}
        aria-label={editing ? "Editar categoria" : "Nova categoria"}
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>{editing ? "Editar categoria" : "Nova categoria"}</strong>
            <p>Nome e tipo — o ícone e a cor seguem o nome</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          <div className="cgx-preview-row">
            <span
              className="cgx-preview"
              style={{
                background: `color-mix(in srgb, ${preview.color} 15%, transparent)`,
                color: preview.color,
              }}
            >
              <preview.Icon aria-hidden="true" size={24} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="txx-field-label">Nome</span>
              <input
                aria-label="Nome"
                className="txx-input"
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Alimentação"
                value={name}
              />
            </div>
          </div>

          <div className="txx-field">
            <span className="txx-field-label">Tipo</span>
            <div className="txx-type-tabs" role="group" aria-label="Tipo da categoria" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 0 }}>
              {typeTabs.map((tab) => (
                <button
                  aria-pressed={type === tab.value}
                  className={tab.className}
                  key={tab.value}
                  onClick={() => setType(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="txx-form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={mutation.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="txx-drawer-save"
            disabled={mutation.isPending}
            onClick={() => {
              setError(null);
              mutation.mutate();
            }}
            type="button"
          >
            {mutation.isPending ? "Salvando…" : "Salvar categoria"}
          </button>
        </div>
      </aside>
    </>
  );
}
