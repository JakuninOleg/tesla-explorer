"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher({ variant = "default" }: { variant?: "default" | "landing" }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={`${variant === "landing" ? "flex items-center gap-0.5 rounded-lg bg-white/[0.06] p-1" : "flex gap-0.5 rounded-sm border border-border p-0.5"} transition-opacity ${
        isPending ? "pointer-events-none opacity-60" : ""
      }`}
      aria-busy={isPending}
    >
      {routing.locales.map((locale) => {
        const active = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            disabled={active || isPending}
            aria-pressed={active}
            aria-label={locale === "ru" ? "Русский" : "English"}
            className={variant === "landing" ? `h-9 min-w-9 rounded-md px-2 text-[11px] font-medium uppercase transition-colors focus-visible:outline-2 focus-visible:outline-white ${active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}` : `h-8 min-w-9 px-2 text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              startTransition(() => {
                router.replace(pathname + window.location.search + window.location.hash, { locale, scroll: false });
              });
            }}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
