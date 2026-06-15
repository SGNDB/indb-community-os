"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {ChevronLeft, ChevronRight, X} from "lucide-react";
import Image from "next/image";
import {useLocale} from "next-intl";

import type {MediaCarouselItem} from "@/components/media/media-carousel";
import {cn} from "@/lib/utils/cn";

interface MediaLightboxProps {
  items: MediaCarouselItem[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaLightbox({items, initialIndex, open, onOpenChange}: MediaLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const currentItem = items[index];

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const goTo = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < items.length) {
      setIndex(newIndex);
    }
  }, [items.length]);

  const goNext = useCallback(() => {
    goTo(isRTL ? index - 1 : index + 1);
  }, [goTo, index, isRTL]);

  const goPrev = useCallback(() => {
    goTo(isRTL ? index + 1 : index - 1);
  }, [goTo, index, isRTL]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      } else if (event.key === "ArrowLeft") {
        if (isRTL) goNext();
        else goPrev();
      } else if (event.key === "ArrowRight") {
        if (isRTL) goPrev();
        else goNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [goNext, goPrev, isRTL, onOpenChange, open]);

  if (!open || !currentItem) return null;

  const hasMultiple = items.length > 1;
  const isVideo = currentItem.type === "video";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-3 py-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] touch-none"
      onClick={() => onOpenChange(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - event.changedTouches[0].clientX;
        if (Math.abs(diff) > 50 && hasMultiple) {
          if (diff > 0) {
            if (isRTL) goPrev();
            else goNext();
          } else if (isRTL) {
            goNext();
          } else {
            goPrev();
          }
        }
        touchStartX.current = null;
      }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goPrev();
              }}
              className="absolute start-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 sm:block"
              aria-label="Previous media"
            >
              <ChevronLeft size={30} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                goNext();
              }}
              className="absolute end-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 sm:block"
              aria-label="Next media"
            >
              <ChevronRight size={30} />
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(false);
          }}
          className="absolute end-3 top-3 z-20 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div
          className={cn(
            "flex max-h-[90vh] max-w-[95vw] items-center justify-center overflow-hidden rounded-2xl shadow-2xl",
            isVideo ? "bg-black" : "bg-transparent",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {isVideo ? (
            <video
              key={currentItem.url}
              src={currentItem.url}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-[90vh] max-w-[95vw] object-contain"
            />
          ) : (
            <div className="relative h-[90vh] w-[95vw]">
              <Image
                src={currentItem.url}
                alt={currentItem.alt ?? ""}
                fill
                sizes="95vw"
                className="select-none object-contain"
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>

      {hasMultiple ? (
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur">
          {index + 1} / {items.length}
        </div>
      ) : null}
    </div>
  );
}
