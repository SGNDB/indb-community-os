"use client";

import {useState} from "react";
import {Search, Lightbulb, Vote, Eye} from "lucide-react";
import {adminUpdateIdeaStatusAction} from "@/app/[locale]/server-actions";

interface IdeaItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  votes_count: number | null;
  created_at: string;
  author: {id: string; full_name: string | null; username: string | null; avatar_url: string | null} | null;
}

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  interested: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  discussion: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function AdminIdeasClient({locale, initialIdeas}: {locale: string; initialIdeas: IdeaItem[]}) {
  const [search, setSearch] = useState("");

  const filtered = initialIdeas.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.author?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas..."
          className="h-11 w-full rounded-2xl border border-border/60 bg-background ps-9 pe-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((idea) => (
          <div key={idea.id} className="rounded-2xl border border-border/60 bg-card p-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="shrink-0 text-amber-500" />
                  <h3 className="truncate text-sm font-semibold text-foreground">{idea.title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[idea.status] || ""}`}>
                    {idea.status}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{idea.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Vote size={12} />{idea.votes_count ?? 0}</span>
                  <span>{idea.author?.full_name ?? idea.author?.username ?? "Unknown"}</span>
                  <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <form action={adminUpdateIdeaStatusAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="ideaId" value={idea.id} />
                  <input type="hidden" name="status" value="in_progress" />
                  <button type="submit" className="rounded-lg p-2 text-muted-foreground hover:bg-green-100 hover:text-green-700" title="Approve">
                    approve
                  </button>
                </form>
                <form action={adminUpdateIdeaStatusAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="ideaId" value={idea.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button type="submit" className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-700" title="Archive">
                    archive
                  </button>
                </form>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-blue-100 hover:text-blue-700" title="View">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No ideas found.</p>
        )}
      </div>
    </div>
  );
}
