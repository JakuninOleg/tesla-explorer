"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LandingEvStage } from "@/features/marketing/landing-ev-stage";

function DemoShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={[
        "overflow-hidden rounded-sm border border-border bg-[#0a0a0a] text-[#f4f4f4]",
        "shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/10",
        "dark:shadow-[0_20px_56px_-20px_rgba(0,0,0,0.75)] dark:ring-white/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Cabinet chat — mirrors PlanChat layout, no desktop chrome. */
export function CabinetChatPreview({ className = "" }: { className?: string }) {
  const t = useTranslations("Home");

  return (
    <DemoShell className={className}>
      <div className="border-b border-white/10 bg-[#111] px-4 py-3">
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#e31937] uppercase">
          {t("demoChatEyebrow")}
        </p>
        <p className="mt-1 text-sm font-medium text-[#f4f4f4]">{t("demoChatTitle")}</p>
        <p className="mt-0.5 text-xs text-[#9a9a9a]">{t("demoChatMeta")}</p>
      </div>
      <div className="flex flex-col gap-3 bg-[#0a0a0a] p-4">
        <div className="landing-chat-in ml-auto max-w-[88%] rounded-sm bg-[#e31937] px-3 py-2.5 text-sm leading-snug text-white">
          {t("demoChatUser")}
        </div>
        <div className="landing-chat-in landing-chat-in-delay mr-auto max-w-[92%] rounded-sm border border-white/10 bg-[#141414] px-3 py-2.5 text-sm leading-snug text-[#e8e8e8]">
          {t("demoChatAssistant")}
        </div>
        <div className="mt-1 flex gap-2">
          <span className="rounded-sm border border-[#e31937] px-2.5 py-1 text-[0.65rem] tracking-[0.08em] text-[#f4f4f4] uppercase">
            {t("demoStartWork")}
          </span>
          <span className="rounded-sm border border-white/15 px-2.5 py-1 text-[0.65rem] tracking-[0.08em] text-[#9a9a9a] uppercase">
            {t("demoHours")}
          </span>
          <span className="rounded-sm border border-white/15 px-2.5 py-1 text-[0.65rem] tracking-[0.08em] text-[#9a9a9a] uppercase">
            {t("demoBattery")}
          </span>
        </div>
        <div className="rounded-sm border border-white/10 bg-[#141414] px-3 py-3 text-xs text-[#6a6a6a]">
          {t("demoChatPlaceholder")}
        </div>
        <div className="inline-flex h-10 items-center justify-center rounded-sm bg-[#e31937] text-xs font-semibold tracking-[0.14em] text-white uppercase">
          {t("demoSend")}
        </div>
      </div>
    </DemoShell>
  );
}

/** 3D route cinema — same EV mesh as the product map, WebGL stage. */
export function RouteCinemaPreview({ className = "" }: { className?: string }) {
  const t = useTranslations("Home");

  return (
    <DemoShell className={className}>
      <div className="border-b border-white/10 bg-[#111] px-4 py-3">
        <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-[#9a9a9a] uppercase">
          {t("demoMapEyebrow")}
        </p>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_40%,rgba(227,25,55,0.2),transparent_55%)]" />
        <LandingEvStage />
        <div className="absolute bottom-3 left-3 right-3 z-[1] flex items-center gap-3">
          <span className="landing-play-pulse inline-flex h-9 items-center rounded-sm bg-[#e31937] px-4 text-[0.65rem] font-semibold tracking-[0.14em] text-white uppercase">
            {t("demoPlay")}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <span className="landing-progress-fill block h-full w-2/5 bg-[#e31937]" />
          </span>
        </div>
      </div>
    </DemoShell>
  );
}

/** Place stop — YouTube-style thumbnail (not a black void). */
export function PlaceStopPreview({ className = "" }: { className?: string }) {
  const t = useTranslations("Home");

  return (
    <DemoShell className={className}>
      <div className="border-b border-white/10 bg-[#111] px-4 py-3">
        <p className="text-[0.65rem] tracking-[0.16em] text-[#9a9a9a] uppercase">
          {t("demoPlaceEyebrow")}
        </p>
        <p className="mt-1 text-base font-semibold text-[#f4f4f4]">
          {t("demoPlaceTitle")}
        </p>
      </div>
      <div className="relative aspect-video overflow-hidden bg-[#c4a574]">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#f0d9b5_0%,#e8b86d_22%,#d4784a_48%,#7a9e6e_70%,#3d6b5a_100%)]" />
        <div className="absolute left-[12%] top-[28%] h-[38%] w-[28%] rounded-sm bg-[#fff8ee]/90 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.35)]" />
        <div className="absolute left-[18%] top-[34%] h-2 w-[16%] rounded-full bg-[#e31937]/80" />
        <div className="absolute right-[10%] top-[22%] h-[48%] w-[36%] rounded-sm bg-[#2c1810]/25" />
        <div className="absolute right-[14%] top-[30%] h-[20%] w-[28%] rounded-sm bg-[#87b8ff]/35" />
        <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[linear-gradient(to_top,rgba(20,12,8,0.72),transparent)]" />
        <div className="absolute left-3 top-3 rounded-sm bg-black/65 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide text-white">
          2:14
        </div>
        <div className="landing-yt-play absolute left-1/2 top-[42%] flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e31937] shadow-[0_8px_28px_-6px_rgba(227,25,55,0.9)]">
          <span className="ml-0.5 border-y-[7px] border-l-[12px] border-y-transparent border-l-white" />
        </div>
        <p className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-medium leading-snug text-white">
          {t("demoPlaceVideoTitle")}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#9a9a9a]">
          <span className="inline-block size-3 rounded-sm bg-[#ff0000]" />
          YouTube
        </span>
        <span className="inline-flex h-9 items-center rounded-sm bg-[#e31937] px-4 text-[0.65rem] font-semibold tracking-[0.12em] text-white uppercase">
          {t("demoContinue")}
        </span>
      </div>
    </DemoShell>
  );
}
