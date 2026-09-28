import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AppWorkspace } from "@/components/app-workspace";
import { getProfileForCurrentUser } from "@/features/profile/profile-actions";
import { DashboardPlanner } from "@/features/map/dashboard-planner";
import { listRoutesForCurrentUser } from "@/features/routes/route-actions";
import { redirect } from "@/i18n/navigation";
import { isLocale, routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard");
  return { title: t("title") };
}
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  const session = await auth();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const profile = await getProfileForCurrentUser();
  if (!profile || profile.workAddress.trim().length < 5) return redirect({ href: "/onboarding", locale });
  const [t, routes] = await Promise.all([getTranslations("Dashboard"), listRoutesForCurrentUser()]);
  const displayName = session.user.name?.split(" ")[0] || t("driver");
  return <AppWorkspace active="dashboard" theme="light" userName={displayName}>
    <main className="mx-auto w-full max-w-[100rem] p-3 sm:p-5">
      <DashboardPlanner key={locale} token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || null} profile={profile} displayName={displayName} homeLabel={profile.homeAddress} workLabel={profile.workAddress} routes={routes} />
    </main>
  </AppWorkspace>;
}
