import type { ReactNode } from "react";

const paths = {
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>,
  work: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V3h8v4M3 12h18m-11-2v4h4v-4" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3L7.5 14 3 9.6l6.2-.9L12 3Z" />,
  settings: <><path d="M3 6h18M3 12h18M3 18h18" /><circle cx="8" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>,
  home: <><path d="m3 10 9-7 9 7M5 9v12h14V9m-10 12v-7h6v7" /></>,
  car: <><path d="m5 10 2-6h10l2 6M3 10h18v8H3v-8Zm2 8v3m14-3v3M6 13h2m8 0h2" /></>,
  send: <path d="m21 3-7 18-4-7-7-4L21 3Zm0 0L10 14" />,
} satisfies Record<string, ReactNode>;

export function LandingIcon({ name, className = "size-5 shrink-0" }: { name: keyof typeof paths; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
