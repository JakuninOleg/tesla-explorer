"use client";

import { useSyncExternalStore, type ReactNode } from "react";

function subscribe(onScroll: () => void) {
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

export function LandingHeader({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, () => window.scrollY > 24, () => false);
  return (
    <header
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-40 border-b border-transparent bg-transparent pt-[env(safe-area-inset-top)] text-white transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 data-[scrolled=true]:border-white/10 data-[scrolled=true]:bg-[#071016]/95 data-[scrolled=true]:shadow-lg data-[scrolled=true]:backdrop-blur-xl motion-reduce:transition-none"
    >
      {children}
    </header>
  );
}
