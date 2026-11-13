"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface CommandPaletteProps {
  groups: {
    label: string;
    items: { label: string; /** Texto corto a la derecha (tipo o atajo). */ hint?: string; /** Elemento resaltado por el teclado. */ active?: boolean }[];
  }[];
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Nombre accesible del diálogo. Por defecto "Paleta de comandos". */
  label?: string;
  className?: string;
}

const itemValue = (group: string, item: string) => `${group}::${item}`;

export function CommandPalette({ groups, defaultValue, placeholder, onChange, label, className }: CommandPaletteProps) {
  const initial = groups.flatMap((g) => g.items.filter((i) => i.active).map((i) => itemValue(g.label, i.label)))[0] ?? "";
  const [selected, setSelected] = useState(initial);
  // cmdk controla el input, así que defaultValue se traduce en estado inicial.
  const [search, setSearch] = useState(defaultValue ?? "");

  return (
    <div className={cx("qp-cmd", className)} role="dialog" aria-label={label || "Paleta de comandos"}>
      <Command shouldFilter={false} value={selected} onValueChange={setSelected} label={label || "Paleta de comandos"}>
        <div className="qp-cmd__bar">
          <span className="qp-searchbar__prompt" aria-hidden="true">
            $
          </span>
          <CommandInput
            className="qp-cmd__input"
            aria-label="Buscar o ir a"
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder || "buscar o ir a…"}
            onChangeCapture={onChange}
          />
          <span className="qp-kbd" aria-hidden="true">
            esc
          </span>
        </div>
        <CommandList className="qp-cmd__list">
          {groups.map((g) => (
            <CommandGroup key={g.label} heading={<span className="qp-cmd__group">{g.label}</span>}>
              {g.items.map((it) => {
                const value = itemValue(g.label, it.label);
                const active = value === selected;
                return (
                  <CommandItem key={it.label} value={value} className={cx("qp-cmd__item", active && "qp-cmd__item--active")}>
                    <span className="qp-cmd__marker" aria-hidden="true">
                      {active ? ">" : ""}
                    </span>
                    <span className="qp-cmd__label">{it.label}</span>
                    {it.hint ? <span className="qp-cmd__hint">{it.hint}</span> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="qp-cmd__footer" aria-hidden="true">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>esc cerrar</span>
        </div>
      </Command>
    </div>
  );
}
