"use client";

import { useEffect, useState } from "react";
import { SiteHeader, type SiteHeaderProps } from "@/components/qp";
import { PaletteDialog } from "./PaletteDialog";

/** SiteHeader with the ⌘K palette wired in. Cmd+K and Ctrl+K toggle it from anywhere. */
export function AppHeader(props: Omit<SiteHeaderProps, "onPaletteClick">) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <SiteHeader {...props} onPaletteClick={() => setOpen(true)} />
      <PaletteDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
