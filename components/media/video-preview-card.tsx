"use client";

import {Play, VideoOff, VolumeX} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";

import {cn} from "@/lib/utils/cn";

interface VideoPreviewCardProps {
  src: string;
  className?: string;
  fallbackAspectClassName?: string;
  onPlay: () => void;
}

function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return null;

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function VideoPreviewCard({
  src,
  className,
  fallbackAspectClassName = "aspect-[4/5]",
  onPlay,
}: VideoPreviewCardProps) {
  const [duration, setDuration] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{width: number; height: number} | null>(null);
  const [failed, setFailed] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const aspectClassName = useMemo(() => {
    if (!dimensions) return fallbackAspectClassName;

    const ratio = dimensions.width / dimensions.height;
    if (ratio < 0.75) return "aspect-[9/16]";
    if (ratio > 1.35) return "aspect-video";
    return "aspect-[4/5]";
  }, [dimensions, fallbackAspectClassName]);

  const durationLabel = formatDuration(duration);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || failed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.muted = true;
          video.play()
            .then(() => setIsAutoPlaying(true))
            .catch(() => setIsAutoPlaying(false));
        } else {
          video.pause();
          setIsAutoPlaying(false);
        }
      },
      {threshold: [0, 0.6, 1]},
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [failed, src]);

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onPlay}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl bg-black text-start shadow-[0_18px_45px_rgba(0,0,0,0.18)] outline-none ring-[#ED2124]/40 transition duration-200 hover:scale-[1.01] focus-visible:ring-2",
        aspectClassName,
        className,
      )}
      aria-label="Play video"
    >
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-white/70">
          <VideoOff size={34} strokeWidth={1.6} />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full bg-black object-contain"
          onPlay={() => setIsAutoPlaying(true)}
          onPause={() => setIsAutoPlaying(false)}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setDuration(video.duration);
            setDimensions({
              width: video.videoWidth || 1,
              height: video.videoHeight || 1,
            });
          }}
          onError={() => setFailed(true)}
        />
      )}

      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/20 transition group-hover:opacity-75",
        isAutoPlaying ? "opacity-35" : "opacity-90",
      )} />

      <span className={cn(
        "absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ED2124] text-white shadow-[0_12px_30px_rgba(237,33,36,0.42)] transition duration-200 group-hover:scale-105",
        isAutoPlaying ? "scale-75 opacity-0" : "opacity-100",
      )}>
        <Play size={28} className="ms-1 fill-white" />
      </span>

      <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
        <VolumeX size={13} />
        muted
      </span>

      {durationLabel ? (
        <span className="absolute bottom-3 end-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">
          {durationLabel}
        </span>
      ) : null}
    </button>
  );
}
