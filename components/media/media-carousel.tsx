"use client";

import {ChevronLeft, ChevronRight, ImageOff} from "lucide-react";
import {useLocale} from "next-intl";
import {useMemo, useRef, useState} from "react";

import {MediaLightbox} from "@/components/media/media-lightbox";
import {VideoPreviewCard} from "@/components/media/video-preview-card";
import {cn} from "@/lib/utils/cn";

export interface MediaCarouselItem {
  url: string;
  type?: "image" | "video";
  alt?: string;
}

interface MediaCarouselProps {
  items: MediaCarouselItem[];
  alt?: string;
  className?: string;
  aspectClassName?: string;
}

export function MediaCarousel({
  items,
  alt = "",
  className,
  aspectClassName = "aspect-[4/5]",
}: MediaCarouselProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loadedIndexes, setLoadedIndexes] = useState<Set<number>>(() => new Set());
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(() => new Set());
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  const mediaItems = useMemo(
    () => items.filter((item) => item.url).map((item) => ({...item, type: item.type ?? "image" as const})),
    [items],
  );
  const hasMultipleMedia = mediaItems.length > 1;
  const currentItem = mediaItems[index];

  if (!currentItem) return null;

  function goTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= mediaItems.length) return;
    setIndex(nextIndex);
  }

  function goNext() {
    goTo(Math.min(mediaItems.length - 1, index + 1));
  }

  function goPrev() {
    goTo(Math.max(0, index - 1));
  }

  function handleSwipe(diff: number) {
    if (Math.abs(diff) < 45 || !hasMultipleMedia) return;
    didSwipe.current = true;
    if (diff > 0) {
      if (isRTL) goPrev();
      else goNext();
    } else if (isRTL) {
      goNext();
    } else {
      goPrev();
    }
    window.setTimeout(() => {
      didSwipe.current = false;
    }, 80);
  }

  function openLightbox() {
    if (didSwipe.current || (currentItem.type !== "video" && failedIndexes.has(index))) return;
    setLightboxOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          "relative w-full min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-muted",
          className,
        )}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          handleSwipe(touchStartX.current - event.changedTouches[0].clientX);
          touchStartX.current = null;
        }}
      >
        <div className={cn("relative w-full overflow-hidden", aspectClassName)}>
          {currentItem.type !== "video" && !loadedIndexes.has(index) && !failedIndexes.has(index) ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/70 to-background" />
          ) : null}

          {currentItem.type === "video" ? (
            <VideoPreviewCard
              src={currentItem.url}
              fallbackAspectClassName={aspectClassName}
              className="h-full rounded-none border-0 shadow-none"
              onPlay={openLightbox}
            />
          ) : failedIndexes.has(index) ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
              <ImageOff size={32} strokeWidth={1.6} />
            </div>
          ) : (
            <button
              type="button"
              onClick={openLightbox}
              className="block h-full w-full cursor-zoom-in text-start"
              aria-label="Open image"
            >
              <img
                src={currentItem.url}
                alt={currentItem.alt ?? alt}
                loading="lazy"
                draggable={false}
                className="h-full w-full select-none object-cover transition duration-300 hover:scale-[1.015]"
                onLoad={() => {
                  setLoadedIndexes((previous) => new Set(previous).add(index));
                }}
                onError={() => {
                  setFailedIndexes((previous) => new Set(previous).add(index));
                }}
              />
            </button>
          )}

          {hasMultipleMedia ? (
            <>
              <div className="absolute end-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                {index + 1} / {mediaItems.length}
              </div>

              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                className="absolute start-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-30 sm:flex"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={index === mediaItems.length - 1}
                className="absolute end-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-sm transition hover:bg-black/65 disabled:pointer-events-none disabled:opacity-30 sm:flex"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur">
                {mediaItems.map((item, dotIndex) => (
                  <button
                    key={`${item.url}-${dotIndex}`}
                    type="button"
                    onClick={() => goTo(dotIndex)}
                    className={cn(
                      "size-1.5 rounded-full transition",
                      dotIndex === index ? "w-4 bg-white" : "bg-white/55 hover:bg-white/80",
                    )}
                    aria-label={`Go to image ${dotIndex + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <MediaLightbox
        items={mediaItems}
        initialIndex={index}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
