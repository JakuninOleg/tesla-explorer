"use client";

import { useEffect, useState } from "react";

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
    // iOS Safari legacy
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/**
 * Native-install CTA when the browser fires `beforeinstallprompt`,
 * plus an iOS “Add to Home Screen” hint when that API is unavailable.
 */
export function PwaInstallButton() {
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

    // Defer platform detection — avoid sync setState inside useEffect body.
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
      <span className="inline-flex h-12 items-center px-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">
        Installed
      </span>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        type="button"
        className="inline-flex h-12 items-center justify-center rounded-sm border border-border px-6 text-sm font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:border-foreground/40"
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
        Install app
      </button>
    );
  }

  if (showIosHint) {
    return (
      <p className="max-w-xs text-xs leading-relaxed tracking-[0.04em] text-muted-foreground">
        On iPhone: Share → <span className="text-foreground">Add to Home Screen</span>
      </p>
    );
  }

  return null;
}
