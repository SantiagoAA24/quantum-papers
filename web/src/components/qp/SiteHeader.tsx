"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";

export interface SiteHeaderProps {
  links?: { label: string; href: string }[];
  homeHref?: string;
  /** Fuerza la versión móvil: botón "menú" en lugar de la navegación. Por debajo de 640px se activa sola. */
  compact?: boolean;
  /** Menú abierto en la versión móvil. Sin esta prop, el componente lo gestiona solo. */
  open?: boolean;
  onMenuClick?: () => void;
  /** Si se indica, el chip ⌘K es un botón que abre la paleta de comandos. */
  onPaletteClick?: () => void;
  className?: string;
}

const DEFAULT_LINKS = [
  { label: "papers", href: "#" },
  { label: "temas", href: "#" },
  { label: "autores", href: "#" },
  { label: "cómo_funciona", href: "#" },
];

export function SiteHeader({ links = DEFAULT_LINKS, homeHref, compact, open: openProp, onMenuClick, onPaletteClick, className }: SiteHeaderProps) {
  const [openState, setOpenState] = useState(false);
  const navId = useId();
  const open = openProp !== undefined ? openProp : openState;

  function toggle() {
    if (onMenuClick) onMenuClick();
    else setOpenState(!openState);
  }

  return (
    <header className={cx("qp-header", compact && "qp-header--compact", open && "qp-header--open", className)}>
      <Link href={homeHref || "#"} className="qp-logo">
        <span className="qp-logo__prompt" aria-hidden="true">
          &gt;
        </span>
        quantum_papers
      </Link>
      <button type="button" className="qp-header__menu" aria-expanded={open ? "true" : "false"} aria-controls={navId} onClick={toggle}>
        {open ? "cerrar" : "menú"}
      </button>
      <nav id={navId} className="qp-nav" aria-label="Principal">
        {links.map((l) => (
          <Link key={l.label} href={l.href}>
            {l.label}
          </Link>
        ))}
        {onPaletteClick ? (
          <button
            type="button"
            className="qp-kbd qp-kbd--button"
            data-qp-palette-trigger=""
            aria-keyshortcuts="Control+K Meta+K"
            onClick={onPaletteClick}
          >
            ⌘K<span className="qp-sr-only"> abrir paleta de comandos</span>
          </button>
        ) : (
          <span className="qp-kbd" aria-hidden="true">
            ⌘K
          </span>
        )}
      </nav>
    </header>
  );
}
