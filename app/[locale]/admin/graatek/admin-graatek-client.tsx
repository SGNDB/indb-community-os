"use client";

import {useState} from "react";
import {Search, Gift, Eye, Archive, Trash2} from "lucide-react";

interface GraatekItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  owner: {id: string; full_name: string | null; username: string | null; avatar_url: string | null} | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  requested: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  reserved: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function AdminGraatekClient({initialItems}: {initialItems: GraatekItem[]}) {
  const [search, setSearch] = useState("");

  const filtered = initialItems.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.owner?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Graatek..."
          className="h-11 w-full rounded-2xl border border-border/60 bg-background ps-9 pe-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="shrink-0 text-primary" />
                  <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[item.status] || ""}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.owner?.full_name ?? item.owner?.username ?? "Unknown"} &middot; {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-blue-100 hover:text-blue-700" title="View"><Eye size={16} /></button>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-700" title="Archive"><Archive size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No Graatek items found.</p>
        )}
      </div>
    </div>
  );
}
