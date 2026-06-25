"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionHeader, GlassCard } from "@/components/admin/admin-shared";
import type { MessagesAdminLabels } from "./messages-labels";

export function MessagesAnalyticsCharts({labels}: {labels: MessagesAdminLabels}) {
  const [timeFilter, setTimeFilter] = useState("days7");
  const data = [
    { name: labels.dayMon, messages: 4000, active: 2400 },
    { name: labels.dayTue, messages: 3000, active: 1398 },
    { name: labels.dayWed, messages: 2000, active: 9800 },
    { name: labels.dayThu, messages: 2780, active: 3908 },
    { name: labels.dayFri, messages: 1890, active: 4800 },
    { name: labels.daySat, messages: 2390, active: 3800 },
    { name: labels.daySun, messages: 3490, active: 4300 },
  ];
  const filters = [
    {value: "today", label: labels.today},
    {value: "days7", label: labels.days7},
    {value: "days30", label: labels.days30},
    {value: "days90", label: labels.days90},
    {value: "year1", label: labels.year1},
  ];

  return (
    <GlassCard className="p-6">
      <SectionHeader eyebrow={labels.analytics} title={labels.messageVolume}>
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                timeFilter === filter.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </SectionHeader>

      <div className="mt-8 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
              itemStyle={{ color: "hsl(var(--foreground))", fontSize: "14px", fontWeight: "bold" }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMessages)"
              name={labels.messages}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
