import {
  Award,
  BookOpen,
  Lightbulb,
  Newspaper,
  Users,
  type LucideIcon,
} from "lucide-react";
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

export function Avatar({
  profile,
  className = "h-11 w-11",
}: {
  profile: {full_name: string | null; username: string | null; avatar_url: string | null} | null;
  className?: string;
}) {
  const name = displayName(profile);
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className={`${className} rounded-full object-cover ring-2 ring-white/70 dark:ring-white/10`} />;
  }

  return (
    <span className={`${className} flex items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-600 ring-2 ring-white/70 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10`}>
      {initials(name)}
    </span>
  );
}

export function ShellCard({className = "", children}: {className?: string; children: ReactNode}) {
  return (
    <div className={`rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_rgba(12,31,44,0.07)] transition duration-300 hover:shadow-[0_14px_36px_rgba(12,31,44,0.09)] ${className}`}>
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
    <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary dark:bg-primary/15">
      {statusMessage}
    </div>
  );
}
