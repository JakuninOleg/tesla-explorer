"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { chatPlanAction } from "@/features/routes/chat-plan-action";
import { buildChatGreeting } from "@/features/routes/plan-prompt";
import type { OnboardingInput } from "@/features/profile/onboarding-schema";
import { isLocale } from "@/i18n/routing";
import { useRouter } from "@/i18n/navigation";

type Turn = { role: "user" | "assistant"; content: string };

export function PlanChat({
  profile,
  displayName,
  homeLabel,
  workLabel,
}: {
  profile: OnboardingInput;
  displayName: string;
  homeLabel: string;
  workLabel: string;
}) {
  const t = useTranslations("Dashboard");
  const localeRaw = useLocale();
  const locale = isLocale(localeRaw) ? localeRaw : "en";
  const router = useRouter();
  const greeting = useMemo(
    () => buildChatGreeting({ displayName, profile, locale }),
    [displayName, profile, locale],
  );
  const [messages, setMessages] = useState<Turn[]>([
    { role: "assistant", content: greeting },
  ]);
  const [greetingLocale, setGreetingLocale] = useState(locale);
  if (greetingLocale !== locale) {
    setGreetingLocale(locale);
    setMessages([{ role: "assistant", content: greeting }]);
  }
  const [draft, setDraft] = useState("");
  const [hours, setHours] = useState(3);
  const [battery, setBattery] = useState(70);
  const [startAnchor, setStartAnchor] = useState<"home" | "work" | "other">(
    "work",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4" data-testid="plan-chat">
      <div className="rounded-sm border border-border bg-muted/30 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-accent text-sm font-semibold tracking-[0.08em] text-accent-foreground"
          >
            AI
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.16em] text-foreground uppercase">
              {t("copilotName")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("copilotSubtitle")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex max-h-[28rem] flex-col gap-3 overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex gap-2 ${
                msg.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              {msg.role === "assistant" ? (
                <span
                  aria-hidden
                  className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-sm bg-accent/90 text-[0.65rem] font-semibold text-accent-foreground"
                >
                  AI
                </span>
              ) : null}
              <div
                className={`max-w-[88%] rounded-sm px-4 py-3 text-base leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-background text-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {pending ? (
            <p className="text-sm tracking-[0.12em] text-muted-foreground uppercase">
              {t("planning")}
            </p>
          ) : null}
        </div>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text || pending) {
              return;
            }
            setError(null);
            setPending(true);
            const nextMessages: Turn[] = [
              ...messages,
              { role: "user", content: text },
            ];
            setMessages(nextMessages);
            setDraft("");

            void (async () => {
              try {
                const result = await chatPlanAction({
                  messages: nextMessages.filter(
                    (m, i) => !(i === 0 && m.role === "assistant"),
                  ),
                  availableHours: hours,
                  batteryPercent: battery,
                  startAnchor,
                  locale,
                });

                if (!result.ok) {
                  setError(
                    result.error === "unauthorized"
                      ? t("errorUnauthorized")
                      : result.error === "no_profile"
                        ? t("errorNoProfile")
                        : result.error === "ai"
                          ? (result.message ?? t("errorAi"))
                          : result.error === "parse"
                            ? t("errorParse")
                            : t("errorSave"),
                  );
                  return;
                }

                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: result.routeId
                      ? `${result.reply}\n\n→ ${t("chatOpenMap")}`
                      : result.reply,
                  },
                ]);

                if (result.routeId) {
                  router.push(`/routes/${result.routeId}`);
                }
              } catch {
                setError(t("errorAi"));
              } finally {
                setPending(false);
              }
            })();
          }}
        >
          <textarea
            data-testid="plan-chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder={t("chatPlaceholder")}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-foreground/40"
          />
          {error ? (
            <p className="text-base text-danger" data-testid="plan-chat-error">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            data-testid="plan-chat-send"
            disabled={pending || draft.trim().length < 2}
            className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? t("planning") : t("chatSend")}
          </button>
        </form>
      </div>

      <details className="rounded-sm border border-border bg-muted/20 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {t("tripSettings")}
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("tripSettingsHint")}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["home", t("startHome", { address: homeLabel })],
                ["work", t("startWork", { address: workLabel })],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStartAnchor(value)}
                className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                  startAnchor === value
                    ? "border-accent text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {t("hours")}
              </span>
              <input
                type="number"
                min={1}
                max={16}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-base text-foreground outline-none focus:border-foreground/40"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {t("battery")}
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                className="mt-2 w-full rounded-sm border border-border bg-muted px-3 py-3 text-base text-foreground outline-none focus:border-foreground/40"
              />
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}
