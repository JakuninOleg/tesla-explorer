"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/features/auth/actions";

export function SignOutButton() {
  const t = useTranslations("Auth");
  const { locale } = useParams<{ locale: string }>();

  return (
    <button
      type="button"
      className="rounded-sm border border-border px-4 py-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:border-foreground/40 hover:text-foreground"
      onClick={() => {
        void signOutAction(locale);
      }}
    >
      {t("signOut")}
    </button>
  );
}
