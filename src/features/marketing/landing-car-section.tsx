import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LandingIcon } from "@/features/marketing/landing-icon";

export async function LandingCarSection() {
  const t = await getTranslations("Home");
  return (
    <section id="car" className="overflow-hidden bg-[#030d12] text-white">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-5 px-5 py-12 sm:px-8 sm:py-11 lg:min-h-[375px] lg:grid-cols-[1.1fr_1.35fr_0.65fr] lg:gap-0 lg:px-14">
        <div>
          <h2 className="text-[1.8rem]! leading-[1.13]! font-medium tracking-[-0.025em] whitespace-pre-line sm:text-[2.4rem]!">{t("carTitle")}</h2>
          <p className="mt-4 max-w-[360px] text-lg leading-[1.4] text-white/65">{t("carBody")}</p>
          <Link href="/sign-in" className="group mt-6 inline-flex min-h-14 items-center justify-center gap-4 rounded-lg bg-white px-6 py-3 text-sm font-medium text-[#10171c] transition-colors duration-300 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500">{t("carCta")}<LandingIcon name="arrow" className="size-5 shrink-0 transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" /></Link>
        </div>
        <div className="relative aspect-[1.5] lg:-mx-4">
          <Image src="/marketing/redesign/car-model-y-v2.webp" alt="" fill className="object-contain [mask-image:radial-gradient(ellipse_65%_50%_at_center,black_60%,transparent_100%)]" sizes="(min-width: 1280px) 540px, (min-width: 1024px) 42vw, 90vw" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[22px] font-normal">Model Y</p>
          <p className="mt-1 text-lg font-light text-white/60">Long Range</p>
          <p className="mt-5 flex items-center gap-2 text-sm text-white/80"><span aria-hidden="true" className="h-3 w-6 overflow-hidden rounded-xs border border-white/60"><span className="block h-full w-[70%] bg-emerald-400" /></span>{t("carBattery")}</p>
          <p className="mt-4 text-xs leading-relaxed text-white/55">{t("carExample")}</p>
        </div>
      </div>
    </section>
  );
}
