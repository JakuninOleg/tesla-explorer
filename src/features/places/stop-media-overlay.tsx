"use client";

export function StopMediaOverlay({
  title,
  embedUrl,
  watchUrl,
  continueLabel,
  watchPlaceLabel,
  openYoutubeLabel,
  onContinue,
}: {
  title: string;
  embedUrl: string | null;
  watchUrl: string;
  continueLabel: string;
  watchPlaceLabel: string;
  openYoutubeLabel: string;
  onContinue: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-xl overflow-hidden rounded-sm border border-border bg-background/95 shadow-2xl">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm tracking-[0.14em] text-muted-foreground uppercase">
            {watchPlaceLabel}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        </div>
        {embedUrl ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              title={title}
              src={embedUrl}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
            <p className="max-w-sm text-base text-muted-foreground">
              {title}
            </p>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-border px-5 text-sm font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent"
            >
              {openYoutubeLabel}
            </a>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-3 px-5 py-4">
          {!embedUrl ? (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-border px-5 text-sm font-semibold tracking-[0.12em] text-foreground uppercase"
            >
              {openYoutubeLabel}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-sm font-semibold tracking-[0.12em] text-accent-foreground uppercase transition-opacity hover:opacity-90"
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
