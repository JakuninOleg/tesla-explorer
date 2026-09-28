import { Roboto } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { BrandMark } from "@/components/brand-mark";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { Link } from "@/i18n/navigation";
const workspaceFont = Roboto({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"] });

type WorkspaceSection = "dashboard" | "routes" | "profile";

const ICONS = {
  home: <path d="m4 11 8-7 8 7v9H4v-9Zm5 9v-6h6v6" />,
  routes: <path d="M5 5h14M5 12h14M5 19h14M8 3v4M16 10v4M10 17v4" />,
  saved: <path d="M6 4h12v16l-6-3.5L6 20V4Z" />,
  history: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  car: <path d="m5 16 1.5-6h11l1.5 6M4 16h16v3H4v-3Zm3-6 2-3h6l2 3M7 19v1M17 19v1" />,
  pin: <><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 2.9a7 7 0 0 0-1.7 1l-2.3-.9-2 3.4L5 11a7 7 0 0 0 0 2l-1.9 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.7 1l.4 2.9h5l.4-2.9a7 7 0 0 0 1.7-1l2.3.9 2-3.4L18.9 13c.1-.3.1-.7.1-1Z" /></>,
} as const;

function WorkspaceIcon({ name }: { name: keyof typeof ICONS }) {
  return <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>{ICONS[name]}</svg>;
}

export async function AppWorkspace({
  active,
  children,
  userName,
}: {
  active: WorkspaceSection;
  children: React.ReactNode;
  theme: "light" | "dark";
  userName: string;
}) {
  const t = await getTranslations("Workspace");
  const locale = await getLocale();
  const nav = [
    { id: "dashboard", href: "/dashboard", label: t("home"), icon: "home" as const },
    { id: "routes", href: "/dashboard#routes", label: t("routes"), icon: "routes" as const },
    { id: "saved", href: "/dashboard#saved", label: t("history"), icon: "history" as const },
  ];

  return (
    <div className={`${workspaceFont.className} min-h-screen bg-[#f6f7f8] text-[#12161c] [color-scheme:light] [--background:#fff] [--foreground:#12161c] [--muted:#f4f5f7] [--muted-foreground:#68717d] [--border:#e2e5e9]`}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-black/7 bg-white px-3 py-5 lg:flex">
        <Link href="/dashboard" className="flex min-h-16 items-center gap-3 rounded-xl bg-[#071016] px-3 text-white">
          <span className="flex size-11 shrink-0 items-center justify-center"><BrandMark className="size-11" /></span>
          <span className="text-xs font-medium tracking-[0.08em]">TESLA<br /><span className="font-normal tracking-[0.15em] text-white/80">EXPLORER</span></span>
        </Link>
        <nav className="mt-9 space-y-1">
          {nav.map((item) => (
            <a key={item.id} href={`/${locale}${item.href}`} className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active === item.id ? "bg-[#f0f1f2] font-semibold text-[#12161c]" : "text-black/55 hover:bg-black/[0.035] hover:text-black"}`}>
              <WorkspaceIcon name={item.icon} />{item.label}
            </a>
          ))}
        </nav>
        <nav className="mt-auto space-y-1 border-t border-black/6 pt-5">
          <Link href="/onboarding" aria-current={active === "profile" ? "page" : undefined} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active === "profile" ? "bg-[#f0f1f2] font-semibold text-[#12161c]" : "text-black/55 hover:bg-black/[0.035] hover:text-black"}`}><WorkspaceIcon name="car" />{t("carProfile")}</Link>
          <SignOutButton className="flex h-10 w-full items-center gap-3 rounded-lg border-0 px-3 text-sm font-normal tracking-normal text-black/55 normal-case transition-colors hover:bg-black/[0.035] hover:text-black" />
        </nav>
      </aside>
      <div className="min-h-screen lg:pl-56">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-black/7 bg-white/90 px-5 backdrop-blur md:px-7">
          <Link href="/dashboard" aria-label="Tesla Explorer" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#071016] lg:hidden"><BrandMark className="size-8" /></Link>
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-2"><LocaleSwitcher /><SignOutButton compact className="flex size-8 items-center justify-center rounded-full border border-black/10 p-0 text-[#12161c] transition-colors hover:border-black/30 hover:bg-black/[0.04]" /><div className="flex size-8 items-center justify-center rounded-full bg-[#17202a] text-xs font-semibold text-white">{userName.slice(0, 1).toUpperCase()}</div><span className="hidden text-sm font-medium sm:block">{userName}</span></div>
        </header>
        <nav className="flex gap-4 overflow-x-auto border-b border-black/5 bg-white px-5 py-3 text-sm lg:hidden">{nav.map((item) => <a key={item.id} href={`/${locale}${item.href}`} className="shrink-0">{item.label}</a>)}<Link href="/onboarding" className="shrink-0">{t("carProfile")}</Link></nav>
        {children}
      </div>
    </div>
  );
}
