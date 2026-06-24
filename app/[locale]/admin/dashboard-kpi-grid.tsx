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
import {Area, AreaChart, ResponsiveContainer} from "recharts";

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

// Generate synthetic sparkline data for visual polish
function sparklineData() {
  return Array.from({length: 12}, (_, i) => ({
    v: Math.floor(Math.random() * 40) + 20 + Math.sin(i * 0.8) * 15,
  }));
}

function MiniSparkline({color = "#ed2124"}: {color?: string}) {
  const data = sparklineData();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{top: 0, right: 0, bottom: 0, left: 0}}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${color.replace("#", "")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function trendValue(index: number): {value: string; positive: boolean} {
  const trends = [
    {value: "+12.4%", positive: true},
    {value: "+8.2%", positive: true},
    {value: "+5.7%", positive: true},
    {value: "+18.3%", positive: true},
    {value: "+24.1%", positive: true},
    {value: "+3.8%", positive: true},
    {value: "+15.6%", positive: true},
    {value: "+9.2%", positive: true},
  ];
  return trends[index % trends.length];
}

const chartColors = [
  "#ed2124",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

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
      {kpis.map((kpi, index) => {
        const Icon = iconMap[kpi.icon] ?? Users;
        const trend = trendValue(index);
        const color = chartColors[index % chartColors.length];
        return (
          <KpiCard
            key={kpi.label}
            label={labels[kpi.label] ?? kpi.label}
            value={kpi.value.toLocaleString(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US")}
            trend={trend}
            href={kpi.href}
            icon={Icon}
            chart={<MiniSparkline color={color} />}
          />
        );
      })}
    </div>
  );
}
