import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { LandingPage } from "@/features/marketing/landing-page";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import { redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { getServerTheme } from "@/lib/theme";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const theme = await getServerTheme();
  const session = await auth();

  if (session?.user) {
    const profile = await getProfileForCurrentUser();
    redirect({ href: profile ? "/dashboard" : "/onboarding", locale });
  }

  // Touch translations early so missing keys fail in CI for this route.
  await getTranslations("Home");

  return <LandingPage theme={theme} />;
}
