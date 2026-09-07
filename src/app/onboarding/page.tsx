import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingForm } from "@/features/profile/onboarding-form";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Get started",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between border-b border-border px-6 py-5 md:px-10">
        <Link
          href="/"
          className="text-[0.7rem] font-semibold tracking-[0.28em] text-foreground uppercase"
        >
          {brand.name}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-12 md:px-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Create your profile
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Tell us where you start from, what you like, and which Tesla you
          drive. We use that to plan routes that fit your time and charge.
        </p>
        <OnboardingForm />
      </main>
    </div>
  );
}
