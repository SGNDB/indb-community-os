"use client";

import {useState} from "react";
import {Send, Globe, Users} from "lucide-react";
import {createNotificationAction} from "@/app/[locale]/server-actions";

export function AdminNotificationsClient({locale}: {locale: string}) {
  const [target, setTarget] = useState("all");

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <form action={createNotificationAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="target" value={target} />

        <div>
          <label className="text-sm font-medium text-foreground">Title</label>
          <input
            type="text"
            name="title"
            maxLength={100}
            placeholder="e.g., New Community Campaign"
            className="mt-1 h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Message</label>
          <textarea
            name="message"
            maxLength={500}
            rows={4}
            placeholder="Write your announcement..."
            className="mt-1 w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Target Audience</label>
          <div className="mt-1 flex gap-2">
            {[
              {value: "all", label: "All Users", icon: Globe},
              {value: "arabic", label: "Arabic Speakers", icon: Users},
              {value: "french", label: "French Speakers", icon: Users},
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTarget(opt.value)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
                    target === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon size={16} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Send size={16} />
          Send Notification
        </button>
      </form>
    </div>
  );
}
