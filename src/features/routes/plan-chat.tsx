"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { chatPlanAction } from "@/features/routes/chat-plan-action";
import { buildChatGreeting } from "@/features/routes/plan-prompt";
import type { OnboardingInput } from "@/features/profile/onboarding-schema";
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
  const router = useRouter();
  const greeting = useMemo(
    () => buildChatGreeting({ displayName, profile }),
    [displayName, profile],
  );
  const [messages, setMessages] = useState<Turn[]>([
    { role: "assistant", content: greeting },
  ]);
  const [draft, setDraft] = useState("");
  const [hours, setHours] = useState(3);
  const [battery, setBattery] = useState(70);
  const [startAnchor, setStartAnchor] = useState<"home" | "work" | "other">(
    "work",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
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

      <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-sm border border-border bg-muted/40 p-4">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`max-w-[92%] rounded-sm px-4 py-3 text-base leading-relaxed ${
              msg.role === "assistant"
                ? "self-start bg-background text-foreground"
                : "self-end bg-accent text-accent-foreground"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <form
        className="flex flex-col gap-3"
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
            const result = await chatPlanAction({
              messages: nextMessages.filter(
                (m, i) => !(i === 0 && m.role === "assistant"),
              ),
              availableHours: hours,
              batteryPercent: battery,
              startAnchor,
            });

            if (!result.ok) {
              setPending(false);
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
              { role: "assistant", content: result.reply },
            ]);
            setPending(false);

            if (result.routeId) {
              router.push(`/routes/${result.routeId}`);
              router.refresh();
            }
          })();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder={t("chatPlaceholder")}
          className="w-full rounded-sm border border-border bg-muted px-4 py-3 text-base text-foreground outline-none focus:border-foreground/40"
        />
        {error ? <p className="text-base text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || draft.trim().length < 2}
          className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t("planning") : t("chatSend")}
        </button>
      </form>
    </div>
  );
}
