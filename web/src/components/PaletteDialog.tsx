"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "@/components/qp";
import { searchHref } from "@/lib/search-params";

type Destination = { label: string; href: string; hint: string };

export const PALETTE_DESTINATIONS: Destination[] = [
  { label: "inicio", href: "/", hint: "/" },
  { label: "papers", href: "/papers/page/1", hint: "/papers" },
  { label: "búsqueda semántica", href: "/search", hint: "/search" },
];

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Command palette in a native modal <dialog>: the browser provides the focus
 * trap, Escape and an inert page behind it. Focus returns to the element that
 * opened it. It never queries the API: the only search action is a navigation.
 */
export function PaletteDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const active = document.activeElement;
      triggerRef.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : document.querySelector<HTMLElement>("[data-qp-palette-trigger]");
      setText("");
      dialog.showModal();
      // showModal() focuses the first focusable element, which is not reliably the input.
      dialog.querySelector<HTMLInputElement>("input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    triggerRef.current?.focus();
  }, [onOpenChange]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const query = text.trim();
  const groups = useMemo(() => {
    const needle = query.toLowerCase();
    const destinations = PALETTE_DESTINATIONS.filter(
      (d) => !needle || d.label.toLowerCase().includes(needle),
    ).map((d) => ({ label: d.label, hint: d.hint, onSelect: () => go(d.href) }));

    const result: {
      label: string;
      items: { label: string; hint?: string; active?: boolean; onSelect: () => void }[];
    }[] = [];
    if (query) {
      result.push({
        label: "buscar",
        items: [
          {
            label: `buscar «${query}»`,
            hint: "↵",
            active: true,
            onSelect: () => go(searchHref(query)),
          },
        ],
      });
    }
    if (destinations.length) {
      if (!query && destinations[0]) Object.assign(destinations[0], { active: true });
      result.push({ label: "ir a", items: destinations });
    }
    return result;
  }, [query, go]);

  return (
    <dialog
      ref={dialogRef}
      className="qp-palette"
      // The inner CommandPalette already exposes role="dialog" with its name; the
      // native element only contributes modality, so it is hidden from the a11y tree.
      role="none"
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onOpenChange(false);
      }}
    >
      {open ? (
        <CommandPalette
          groups={groups}
          onChange={(e) => setText(e.target.value)}
        />
      ) : null}
    </dialog>
  );
}
