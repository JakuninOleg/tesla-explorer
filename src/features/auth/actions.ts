"use server";

import { signIn, signOut } from "@/auth";
import { isLocale, routing, type Locale } from "@/i18n/routing";

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : routing.defaultLocale;
}

export async function signInWithGoogle(locale: string) {
  const safeLocale = resolveLocale(locale);
  await signIn("google", { redirectTo: `/${safeLocale}/onboarding` });
}

export async function signOutAction(locale: string) {
  const safeLocale = resolveLocale(locale);
  await signOut({ redirectTo: `/${safeLocale}` });
}
