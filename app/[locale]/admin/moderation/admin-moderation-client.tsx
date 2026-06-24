"use client";

import {useState} from "react";
import {Search, Shield, Eye, Trash2, AlertTriangle} from "lucide-react";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter: {id: string; full_name: string | null; username: string | null; avatar_url: string | null} | null;
}

export function AdminModerationClient({initialReports}: {initialReports: Report[]}) {
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");

  const filtered = reports.filter(
    (r) =>
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports..."
          className="h-11 w-full rounded-2xl border border-border/60 bg-background ps-9 pe-4 text-sm outline-none focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((report) => (
          <div key={report.id} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span className="text-sm font-semibold text-foreground capitalize">{report.reason.replace("_", " ")}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    {report.status}
                  </span>
                </div>
                {report.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Reported by {report.reporter?.full_name ?? report.reporter?.username ?? "Anonymous"}
                  {" · "}{new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-blue-100 hover:text-blue-700" title="Review"><Eye size={16} /></button>
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-700" title="Remove"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No reports found. Everything looks clean!</p>
        )}
      </div>
    </div>
  );
}
