"use client";

import { useTransition } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale: currentLocale } = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={`flex gap-0.5 rounded-sm border border-border p-0.5 transition-opacity ${
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
            className={`h-8 min-w-9 px-2 text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              startTransition(() => {
                router.replace(pathname, { locale });
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
