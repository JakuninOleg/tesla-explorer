"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function ThemeToggle({ currentTheme }: { currentTheme: "light" | "dark" }) {
  const router = useRouter();
  const t = useTranslations("Chrome");
  const [theme, setTheme] = useState(currentTheme);
  const [prevTheme, setPrevTheme] = useState(currentTheme);

  if (currentTheme !== prevTheme) {
    setPrevTheme(currentTheme);
    setTheme(currentTheme);
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-label={t("toggleTheme")}
      onClick={toggle}
      className="inline-flex size-10 items-center justify-center rounded-sm border border-border text-foreground transition-colors hover:border-foreground/40"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
        </svg>
      )}
    </button>
  );
}
