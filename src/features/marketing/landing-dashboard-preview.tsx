import { BrandMark } from "@/components/brand-mark";
import { getTranslations } from "next-intl/server";
import { LandingIcon } from "@/features/marketing/landing-icon";

/** Read-only, responsive miniature of the current workspace and PlanChat flow. */
export async function LandingDashboardPreview() {
  const t = await getTranslations("Home");
  const w = await getTranslations("Workspace");
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-xl border border-[#dce1e5] bg-[#f6f7f8] text-[#12161c] shadow-[0_18px_45px_-22px_#08131c66]">
        <div className="grid sm:grid-cols-[112px_minmax(0,1fr)]">
          <aside className="hidden border-r border-black/7 bg-white px-3 py-4 sm:block">
            <div className="flex items-center gap-1.5"><BrandMark className="size-5 shrink-0" /><span className="text-[8px] font-bold tracking-wide uppercase">Tesla Explorer</span></div>
            <div className="mt-6 space-y-4 text-[10px]">
              <div className="flex items-center gap-2 rounded-md bg-[#eef0f2] p-2 font-semibold"><LandingIcon name="home" className="size-3 shrink-0" />{w("home")}</div>
              <div className="px-2">{w("routes")}</div>
              <div className="px-2">{w("saved")}</div>
              <div className="px-2">{w("history")}</div>
              <div className="mt-16 flex items-center gap-2 px-2"><LandingIcon name="car" className="size-3 shrink-0" />{w("carProfile")}</div>
            </div>
          </aside>
          <div className="min-w-0">
            <div className="flex h-10 items-center justify-between border-b border-black/5 bg-white px-4 text-[10px]"><span>{w("home")}</span><span className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-full bg-[#17202a] text-white">O</span>{t("demoName")}</span></div>
            <div className="space-y-3 p-3 sm:p-4">
              <div className="rounded-lg bg-[#07131d] p-4 text-white">
                <p className="text-[9px] tracking-widest text-white/60 uppercase">Model Y</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">{t("demoGreeting")}</p>
                <p className="mt-2 text-xs text-white/70">{t("demoSearch")}</p>
              </div>
              <div className="rounded-lg border border-[#e2e6e9] bg-white p-3">
                <p className="flex items-center gap-2 text-xs font-semibold"><span className="flex size-7 items-center justify-center rounded bg-[#e31937] text-[10px] text-white">AI</span>{t("demoChatTitle")}</p>
                <p className="mt-3 rounded bg-[#f0f2f4] p-3 text-xs leading-relaxed">{t("demoChatAssistant")}</p>
                <p className="mt-3 ml-6 rounded bg-[#e31937] p-3 text-xs leading-relaxed text-white">{t("demoChatUser")}</p>
                <div className="mt-3 flex items-center justify-between gap-3 rounded border border-[#dce1e5] p-3 text-[11px] text-[#737c85]"><span>{t("demoChatPlaceholder")}</span><LandingIcon name="send" className="size-4 shrink-0 text-[#e31937]" /></div>
              </div>
              <div className="rounded-lg border border-[#e2e6e9] bg-white p-3"><p className="text-[10px] text-[#69727b]">{w("routes")}</p><p className="mt-1 text-xs font-semibold">{t("demoRouteTitle")}</p><p className="mt-1 text-[10px] text-[#69727b]">{t("demoRouteMeta")}</p></div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-[#68727b]">{t("demoCaption")}</figcaption>
    </figure>
  );
}
