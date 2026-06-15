"use client";

import {MediaCarousel} from "@/components/media/media-carousel";

interface GalleryItem {
  url: string;
  type: "image" | "video";
}

interface MediaGalleryProps {
  items: GalleryItem[];
  className?: string;
}

export function MediaGallery({items, className = ""}: MediaGalleryProps) {
  if (items.length === 0) return null;

  return <MediaCarousel items={items} className={className} />;
}
