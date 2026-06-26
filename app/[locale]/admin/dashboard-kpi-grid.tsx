import {
  Users,
  Lightbulb,
  Gift,
  Images,
  MessageCircle,
  HandHeart,
  UsersRound,
  Bell,
  type LucideIcon,
} from "lucide-react";

import type {AdminDashboardKPI} from "@/lib/data/admin";
import {KpiCard} from "@/components/admin/admin-shared";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Lightbulb,
  Gift,
  Images,
  MessageCircle,
  HandHeart,
  UsersRound,
  Bell,
};

export function DashboardKpiGrid({
  kpis,
  labels,
  locale,
}: {
  kpis: AdminDashboardKPI[];
  labels: Record<string, string>;
  locale: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon] ?? Users;
        return (
          <KpiCard
            key={kpi.label}
            label={labels[kpi.label] ?? kpi.label}
            value={kpi.value.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US")}
            href={kpi.href}
            icon={Icon}
          />
        );
      })}
    </div>
  );
}
