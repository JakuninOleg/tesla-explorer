"use client";

import { useEffect } from "react";

/**
 * Registers the shell service worker for PWA installability.
 * Skips registration in development (avoids stale caches while iterating).
 */
export function PwaRegister(): null {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
