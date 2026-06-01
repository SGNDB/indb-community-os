import type {MemoryItem} from "@/lib/constants/mock-data";
import {MemoryCard} from "@/components/memory/memory-card";

export function MemoryGrid({items}: {items: MemoryItem[]}) {
  return (
    <section className="columns-1 gap-4 space-y-4 md:columns-2 xl:columns-3">
      {items.map((memory) => (
        <div key={memory.slug} className="break-inside-avoid">
          <MemoryCard memory={memory} />
        </div>
      ))}
    </section>
  );
}

