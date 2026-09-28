/** Symbol viewport from the supplied artwork; the original pixels are preserved. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="580 45 620 480" className={className} aria-hidden="true">
      <image href="/brand/tesla-explorer-ru.png" width="1760" height="872" />
    </svg>
  );
}
