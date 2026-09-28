import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AppWorkspace } from "@/components/app-workspace";
import { OnboardingForm } from "@/features/profile/onboarding-form";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import { Link, redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Onboarding");
  return { title: t("title") };
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const session = await auth();

  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
  }

  const [t, profile] = await Promise.all([
    getTranslations("Onboarding"),
    getProfileForCurrentUser(),
  ]);

  return (
    <AppWorkspace active="profile" theme="light" userName={session?.user?.name ?? ""}>
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {profile ? t("titleEdit") : t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {profile ? t("introEdit") : t("intro")}
        </p>
        <OnboardingForm initialProfile={profile} />
        {profile ? (
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("back")}
          </Link>
        ) : null}
      </main>
    </AppWorkspace>
  );
}
