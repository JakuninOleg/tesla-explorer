"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/features/auth/actions";

export function SignOutButton({ className, compact = false }: { className?: string; compact?: boolean } = {}) {
  const t = useTranslations("Auth");
  const { locale } = useParams<{ locale: string }>();

  return (
    <button
      type="button"
      className={"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap " + (className ?? "rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground")}
      onClick={() => {
        void signOutAction(locale);
      }}
    >
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {compact ? <span className="sr-only">{t("signOut")}</span> : t("signOut")}
    </button>
  );
}
