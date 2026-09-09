"use client";

import { useEffect, useState } from "react";
import { buildYoutubeEmbedUrl } from "@/features/places/place-links";

export function StopMediaOverlay({
  title,
  description,
  videoId: initialVideoId,
  continueLabel,
  watchPlaceLabel,
  openYoutubeLabel,
  onContinue,
}: {
  title: string;
  description?: string | null;
  videoId?: string | null;
  continueLabel: string;
  watchPlaceLabel: string;
  openYoutubeLabel: string;
  onContinue: () => void;
}) {
  const [videoId, setVideoId] = useState<string | null>(
    initialVideoId?.trim() || null,
  );
  const [resolving, setResolving] = useState(!initialVideoId);

  useEffect(() => {
    if (initialVideoId?.trim()) {
      const timer = window.setTimeout(() => {
        setVideoId(initialVideoId.trim());
        setResolving(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setResolving(true);
      void (async () => {
        try {
          const res = await fetch(
            `/api/places/youtube?q=${encodeURIComponent(`${title} review`)}`,
            { signal: controller.signal },
          );
          if (!res.ok) {
            setVideoId(null);
            return;
          }
          const body = (await res.json()) as { videoId?: string | null };
          setVideoId(body.videoId?.trim() || null);
        } catch {
          if (!controller.signal.aborted) {
            setVideoId(null);
          }
        } finally {
          if (!controller.signal.aborted) {
            setResolving(false);
          }
        }
      })();
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [initialVideoId, title]);

  const media = buildYoutubeEmbedUrl({
    placeName: title,
    videoId,
  });

  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 p-4 backdrop-blur-[2px] sm:items-center"
      data-testid="stop-media-overlay"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-sm border border-border bg-background/95 shadow-2xl">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm tracking-[0.14em] text-muted-foreground uppercase">
            {watchPlaceLabel}
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {description ? (
            <p
              className="mt-2 text-base leading-relaxed text-muted-foreground"
              data-testid="stop-media-description"
            >
              {description}
            </p>
          ) : null}
        </div>
        <div className="aspect-video w-full bg-black">
          {resolving ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-base text-muted-foreground">
              …
            </div>
          ) : media.embedUrl ? (
            <iframe
              title={`${title} video`}
              src={media.embedUrl}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
              <p className="max-w-sm text-base text-muted-foreground">
                {description ?? title}
              </p>
              <a
                href={media.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold tracking-[0.1em] text-accent uppercase"
              >
                {openYoutubeLabel}
              </a>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <a
            href={media.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm tracking-[0.08em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {openYoutubeLabel}
          </a>
          <button
            type="button"
            data-testid="stop-media-continue"
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
