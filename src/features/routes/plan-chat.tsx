"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LandingIcon } from "@/features/marketing/landing-icon";
import { SCENARIOS } from "./dashboard-data";
import type { TripPlanner } from "./use-trip-planner";

export function PlanChat({ planner, onScenario }: { planner: TripPlanner; onScenario: (id: typeof SCENARIOS[number]["id"]) => void }) {
  const t = useTranslations("Dashboard");
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [planner.messages, planner.pending]);
  return <section id="explorer-chat" aria-label={t("copilotName")} className="flex min-h-[460px] flex-col rounded-xl border border-border bg-background p-5" data-testid="plan-chat">
    <h2 className="flex items-center gap-2 text-lg! font-semibold"><span className="text-accent"><LandingIcon name="spark" /></span>{t("copilotName")}</h2>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("copilotSubtitle")}</p>
    <div ref={log} role="log" aria-live="polite" aria-label={t("conversation")} className="mt-5 flex max-h-80 min-h-32 flex-1 flex-col gap-3 overflow-y-auto text-sm leading-relaxed">
      <p className="self-start rounded-xl rounded-tl-sm bg-muted px-4 py-3">{t("chatWelcome")}</p>
      {planner.messages.map((message, index) => <p key={index} className={`max-w-[95%] whitespace-pre-wrap break-words rounded-xl px-4 py-3 ${message.role === "user" ? "self-end rounded-br-sm bg-foreground text-background" : "self-start rounded-tl-sm bg-muted"}`}>{message.content}</p>)}
      {planner.pending ? <p role="status" className="text-muted-foreground">{t("planning")}</p> : null}
    </div>
    {planner.messages.length === 0 ? <div className="my-4 space-y-2">{SCENARIOS.map((scenario) => <button key={scenario.id} disabled={planner.pending} onClick={() => onScenario(scenario.id)} className="w-full cursor-pointer rounded-full border border-border px-4 py-2.5 text-left text-xs leading-relaxed transition-colors hover:border-accent/40 hover:bg-muted disabled:cursor-wait">{t(`scenarios.${scenario.id}.suggestion`)}</button>)}</div> : null}
    <form className="mt-4" onSubmit={(event) => { event.preventDefault(); void planner.send(); }}>
      <label htmlFor="chat-draft" className="sr-only">{t("prompt")}</label>
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/40 p-2 focus-within:border-accent/50">
        <textarea id="chat-draft" data-testid="plan-chat-input" disabled={planner.pending} maxLength={4000} value={planner.draft} onChange={(event) => planner.setDraft(event.target.value)} rows={2} placeholder={t("chatPlaceholder")} className="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none" />
        <button type="submit" aria-label={t("chatSend")} data-testid="plan-chat-send" disabled={!planner.canSend} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:bg-black/15"><LandingIcon name="send" className="size-4" /></button>
      </div>
      {planner.error ? <p role="alert" data-testid="plan-chat-error" className="mt-3 text-sm text-danger">{planner.error}</p> : null}
      {planner.draft.trim().length > 0 && planner.draft.trim().length < 8 ? <p className="mt-2 text-xs text-muted-foreground">{t("promptHint")}</p> : null}
    </form>
  </section>;
}
