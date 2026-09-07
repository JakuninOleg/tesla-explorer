"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function PwaInstallButton() {
  const t = useTranslations("Chrome");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      if (isStandaloneDisplay()) {
        setInstalled(true);
        return;
      }
      if (isIosDevice()) {
        setShowIosHint(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <span className="inline-flex h-10 items-center px-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">
        {t("installed")}
      </span>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-4 text-xs font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:border-foreground/40"
        onClick={() => {
          void (async () => {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
              setInstalled(true);
            }
            setDeferredPrompt(null);
          })();
        }}
      >
        {t("installApp")}
      </button>
    );
  }

  if (showIosHint) {
    return (
      <p className="max-w-[11rem] text-[0.65rem] leading-snug text-muted-foreground">
        {t("iosInstallHint")}
      </p>
    );
  }

  return null;
}
