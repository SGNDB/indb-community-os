import {Users, Newspaper, Lightbulb, BookOpen, Flame} from "lucide-react";

interface Overview {
  totalUsers: number;
  totalPosts: number;
  totalIdeas: number;
  totalMemories: number;
  totalComments: number;
  activeToday: number;
  newMembersToday: number;
  postsToday: number;
  ideasToday: number;
  memoriesToday: number;
}

export function HealthSection({overview, t}: {overview: Overview; t: (key: string, values?: Record<string, string | number>) => string}) {
  const cards = [
    {
      label: t("health.members"),
      value: overview.totalUsers,
      indicator: t("health.newToday", {count: overview.newMembersToday}),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("health.posts"),
      value: overview.totalPosts,
      indicator: t("health.today", {count: overview.postsToday}),
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      label: t("health.ideas"),
      value: overview.totalIdeas,
      indicator: t("health.today", {count: overview.ideasToday}),
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: t("health.memories"),
      value: overview.totalMemories,
      indicator: t("health.today", {count: overview.memoriesToday}),
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("health.eyebrow")}</p>
          <h2 className="mt-0.5 text-xl font-black text-foreground">{t("health.title")}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5">
          <Flame size={14} className="text-orange-500" />
          <span className="text-sm font-bold text-foreground">{overview.activeToday}</span>
          <span className="text-xs text-muted-foreground">{t("health.activeToday")}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card, i) => {
          const icons = [Users, Newspaper, Lightbulb, BookOpen];
          const Icon = icons[i];
          return (
            <div key={card.label} className="rounded-xl border border-border/40 bg-muted/30 p-4 transition hover:border-border/60">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                <Icon size={17} />
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
                {card.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
              <p className={`mt-1 text-xs font-semibold ${card.color}`}>{card.indicator}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {t("health.totalComments", {count: overview.totalComments})}
        </span>
        <span className="text-xs text-muted-foreground">
          {overview.totalComments.toLocaleString()} total
        </span>
      </div>
    </div>
  );
}
