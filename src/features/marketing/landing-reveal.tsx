"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function isNearViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.92 && rect.bottom > 0;
}

export function LandingReveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  /** Visible until JS arms the reveal — no blank page without JS. */
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const node = ref.current;
    if (!node) {
      return;
    }

    if (reduceMotion || isNearViewport(node)) {
      const idle = window.setTimeout(() => {
        setArmed(false);
        setVisible(true);
      }, 0);
      return () => window.clearTimeout(idle);
    }

    let delayTimer = 0;
    const armTimer = window.setTimeout(() => {
      setVisible(false);
      setArmed(true);
    }, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            delayTimer = window.setTimeout(() => setVisible(true), delayMs);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(armTimer);
      window.clearTimeout(delayTimer);
    };
  }, [delayMs]);

  const hidden = armed && !visible;

  return (
    <div
      ref={ref}
      className={[
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        hidden ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
