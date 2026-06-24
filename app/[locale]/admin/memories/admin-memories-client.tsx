"use client";

import {useState} from "react";
import {Search, Images, Eye, Archive, Star, Trash2} from "lucide-react";

interface MemoryItem {
  id: string;
  title: string;
  description: string | null;
  verification_status: string;
  reactions_count: number | null;
  comments_count: number | null;
  created_at: string;
  contributor: {id: string; full_name: string | null; username: string | null; avatar_url: string | null} | null;
}

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  needs_more_info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export function AdminMemoriesClient({initialMemories}: {initialMemories: MemoryItem[]}) {
  const [search, setSearch] = useState("");
  const [memories, setMemories] = useState(initialMemories);

  const filtered = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.contributor?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memories..."
          className="h-11 w-full rounded-2xl border border-border/60 bg-background ps-9 pe-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((memory) => (
          <div key={memory.id} className="rounded-2xl border border-border/60 bg-card p-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Images size={16} className="shrink-0 text-purple-500" />
                  <h3 className="truncate text-sm font-semibold text-foreground">{memory.title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[memory.verification_status] || ""}`}>
                    {memory.verification_status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{memory.description}</p>
                <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>❤️ {memory.reactions_count ?? 0}</span>
                  <span>💬 {memory.comments_count ?? 0}</span>
                  <span>{memory.contributor?.full_name ?? memory.contributor?.username ?? "Unknown"}</span>
                  <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-amber-100 hover:text-amber-700" title="Feature"><Star size={16} /></button>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-blue-100 hover:text-blue-700" title="View"><Eye size={16} /></button>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-700" title="Archive"><Archive size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No memories found.</p>
        )}
      </div>
    </div>
  );
}
