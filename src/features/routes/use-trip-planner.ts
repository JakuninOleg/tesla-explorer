"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { chatPlanAction } from "./chat-plan-action";
import { validPlannerDraft, validTripSettings } from "./dashboard-data";
import type { StartAnchor } from "@/features/map/home-map-state";

export type PlannerTurn = { role: "user" | "assistant"; content: string };
export function useTripPlanner() {
  const t = useTranslations("Dashboard");
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const router = useRouter();
  const [messages, setMessages] = useState<PlannerTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [hours, setHours] = useState(3);
  const [battery, setBattery] = useState(70);
  const [anchor, setAnchor] = useState<StartAnchor>("home");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Both composers share this lock, including before React's next render.
  const sending = useRef(false);
  const canSend = validPlannerDraft(draft) && validTripSettings(hours, battery) && !pending;
  async function send() {
    if (!canSend || sending.current) return;
    sending.current = true;
    setPending(true); setError(null);
    const submitted = draft.trim();
    const next: PlannerTurn[] = [...messages, { role: "user", content: submitted }];
    setMessages(next); setDraft("");
    try {
      const result = await chatPlanAction({ messages: next, availableHours: hours, batteryPercent: battery, startAnchor: anchor, locale });
      if (!result.ok) {
        setMessages(messages); setDraft(submitted);
        setError(result.error === "unauthorized" ? t("errorUnauthorized") : result.error === "no_profile" ? t("errorNoProfile") : result.error === "ai" ? (result.message ?? t("errorAi")) : result.error === "parse" ? t("errorParse") : t("errorSave"));
        return;
      }
      setMessages([...next, { role: "assistant", content: result.reply }]);
      if (result.routeId) router.push(`/routes/${result.routeId}`);
    } catch {
      setMessages(messages); setDraft(submitted); setError(t("errorAi"));
    } finally { sending.current = false; setPending(false); }
  }
  return { messages, draft, setDraft, hours, setHours, battery, setBattery, anchor, setAnchor, pending, error, canSend, send };
}
export type TripPlanner = ReturnType<typeof useTripPlanner>;
