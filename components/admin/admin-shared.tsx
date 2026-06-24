import {
  Award,
  BookOpen,
  Gift,
  Landmark,
  Lightbulb,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import type {ReactNode} from "react";

import type {AdminActivityItem, AdminContentType} from "@/lib/data/admin";

export const adminStatuses = [
  "roleUpdated",
  "creditsAwarded",
  "contentDeleted",
  "invalid",
  "roleError",
  "creditError",
  "deleteError",
  "selfRoleBlocked",
  "selfDeleteBlocked",
  "userDeleted",
  "userDeleteError",
  "userDeleteConfigError",
] as const;

export const contentIcons: Record<AdminContentType, LucideIcon> = {
  post: Newspaper,
  idea: Lightbulb,
  memory: BookOpen,
};

export const activityIcons: Record<AdminActivityItem["type"], LucideIcon> = {
  post: Newspaper,
  idea: Lightbulb,
  memory: BookOpen,
  credit: Award,
  member: Users,
  graatek: Gift,
  donation: Landmark,
  volunteer: UsersRound,
};

export function displayName(profile: {full_name: string | null; username: string | null} | null) {
  if (!profile) return "-";
  return profile.full_name ?? profile.username ?? "-";
}

export function initials(name: string) {
  const clean = name.trim();
  if (!clean || clean === "-") return "?";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export function AdminAvatar({
  profile,
  className = "h-11 w-11",
}: {
  profile: {full_name: string | null; username: string | null; avatar_url: string | null} | null;
  className?: string;
}) {
  const name = displayName(profile);
  if (profile?.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={80}
        height={80}
        className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white/70 dark:ring-white/10`}
      />
    );
  }
  return (
    <span
      className={`${className} shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 font-bold text-primary ring-2 ring-white/70 dark:ring-white/10`}
    >
      {initials(name)}
    </span>
  );
}

export function GlassCard({className = "", children, hover = true}: {className?: string; children: ReactNode; hover?: boolean}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] ${
        hover
          ? "transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.03)] hover:border-border/80"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  trend,
  href,
  icon: Icon,
  chart,
}: {
  label: string;
  value: string;
  trend?: {value: string; positive: boolean};
  href: string;
  icon: LucideIcon;
  chart?: ReactNode;
}) {
  return (
    <a
      href={href}
      className="admin-kpi-card group relative flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.03)] hover:border-border/80"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
          <Icon size={20} />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              trend.positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {chart && <div className="kpi-chart">{chart}</div>}
    </a>
  );
}

export function TrendBadge({value, positive}: {value: string; positive: boolean}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {value}
    </span>
  );
}

export function StatusBadge({status}: {status: string}) {
  const colors: Record<string, string> = {
    healthy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function SectionHeader({eyebrow, title, children}: {eyebrow: string; title: string; children?: ReactNode}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2 className="mt-0.5 text-xl font-black text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function AdminStatusMessage({
  status,
  t,
}: {
  status?: string;
  t: (key: string) => string;
}) {
  const statusMessage = adminStatuses.includes(status as (typeof adminStatuses)[number])
    ? t(`statusMessage.${status}`)
    : null;
  if (!statusMessage) return null;
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
      {statusMessage}
    </div>
  );
}

export function LiveDot({className = ""}: {className?: string}) {
  return (
    <span className={`relative flex h-2.5 w-2.5 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

/* Legacy aliases */
export const Avatar = AdminAvatar;
export const ShellCard = GlassCard;
