import {activityIcons, displayName} from "@/components/admin/admin-shared";
import type {AdminActivityItem} from "@/lib/data/admin";

function formatTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityTimeline({
  activity,
  t,
}: {
  activity: AdminActivityItem[];
  t: (key: string) => string;
}) {
  const typeLabels: Record<string, string> = {
    member: "New registration",
    idea: "New idea",
    graatek: "New graatek",
    donation: "Donation",
    post: "New post",
    memory: "New memory",
    credit: "Credit awarded",
    volunteer: "Volunteer",
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("sections.overview")}</p>
      <h2 className="mt-0.5 text-xl font-black text-foreground">{t("activity.title")}</h2>

      <div className="mt-5 space-y-0">
        {activity.slice(0, 8).map((item, index) => {
          const Icon = activityIcons[item.type];
          return (
            <a
              key={item.id}
              href={item.href}
              className="group grid grid-cols-[auto_1fr] gap-3 transition"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                  <Icon size={16} />
                </div>
                {index < Math.min(activity.length, 8) - 1 && (
                  <div className="h-6 w-px bg-border/60" />
                )}
              </div>
              <div className="min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground/60">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {typeLabels[item.type] ?? item.type}
                  {item.actor ? ` · ${displayName(item.actor)}` : ""}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {activity.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t("noData")}</p>
      )}
    </div>
  );
}
