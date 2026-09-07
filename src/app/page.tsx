import Image from "next/image";
import Link from "next/link";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:64px_64px]"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={brand.markSrc}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-sm"
            priority
          />
          <span className="text-[0.7rem] font-semibold tracking-[0.28em] text-foreground uppercase">
            Tesla Explorer
          </span>
        </Link>
        <PwaInstallButton />
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-20 md:px-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-5 text-[0.7rem] font-medium tracking-[0.32em] text-accent uppercase">
              After hours · USA
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.05]">
              {brand.name}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              {brand.tagline} Tell us your time, mood, and battery — we chart a
              charge-aware evening around wherever you landed.
            </p>
            <div id="plan" className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="#plan"
                className="inline-flex h-12 min-h-11 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
              >
                Start planning
              </Link>
              <span className="inline-flex h-12 items-center px-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                Sprint 1 · PWA
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-sm shrink-0 self-center md:self-auto">
            <div className="overflow-hidden rounded-sm border border-border bg-muted/80">
              <Image
                src={brand.markSrc}
                alt={`${brand.name} mark`}
                width={512}
                height={512}
                className="h-auto w-full"
                priority
              />
            </div>
            <p className="mt-3 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
              Installable · standalone display
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-4 md:px-10">
        <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          Pet project · Tesla-inspired UI · not affiliated with Tesla, Inc.
        </p>
      </footer>
    </div>
  );
}
