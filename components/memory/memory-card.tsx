"use client";

import {motion} from "framer-motion";
import {MapPin, UserRound} from "lucide-react";

import type {MemoryItem} from "@/lib/constants/mock-data";
import {Link} from "@/lib/i18n/routing";

export function MemoryCard({memory}: {memory: MemoryItem}) {
  return (
    <motion.article
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: "easeOut"}}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_12px_28px_rgba(8,33,56,0.08)]"
    >
      <Link href={`/memory/${memory.slug}` as never} className="block">
        <img src={memory.image} alt={memory.title} className="h-52 w-full object-cover" />
        <div className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{memory.year}</p>
          <h3 className="text-lg font-semibold">{memory.title}</h3>
          <p className="text-sm text-muted-foreground">{memory.summary}</p>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={13} />
            {memory.location}
          </p>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <UserRound size={13} />
            {memory.contributor}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

