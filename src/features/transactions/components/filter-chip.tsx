"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type FilterOption = {
  value: string;
  label: string;
};

type FilterChipProps = {
  label: string;
  options: FilterOption[];
  value: string;
  /** valor considerado "sem filtro" — chip fica neutro e sem X */
  emptyValue?: string;
  icon?: React.ReactNode;
  onChange: (value: string) => void;
};

export function FilterChip({ label, options, value, emptyValue = "", icon, onChange }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = value !== emptyValue;
  const activeLabel = options.find((option) => option.value === value)?.label ?? label;

  return (
    <div className="txx-filter" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn("txx-chip", isActive && "txx-chip-active")}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {icon}
        {isActive ? activeLabel : label}
        {isActive ? (
          <X
            aria-label={`Limpar filtro ${label}`}
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onChange(emptyValue);
            }}
            role="button"
            size={13}
          />
        ) : (
          <ChevronDown aria-hidden="true" color="var(--text-muted)" size={13} />
        )}
      </button>
      {open ? (
        <div className="txx-filter-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => {
                setOpen(false);
                onChange(option.value);
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
