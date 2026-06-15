import {MemoryCard} from "@/components/memory/memory-card";
import type {MemoryWithContributor} from "@/types/database";

export function MemoryGrid({items}: {items: MemoryWithContributor[]}) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </section>
  );
}
