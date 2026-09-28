import Image from "next/image";

/** Supplied artwork, including the localized tagline, used without redrawing. */
export function BrandLogo({ locale, className }: { locale: string; className?: string }) {
  return <Image src={`/brand/tesla-explorer-${locale === "ru" ? "ru" : "en"}.png`} alt="Tesla Explorer" width={1760} height={872} sizes="224px" className={className ?? "h-auto w-44"} />;
}
