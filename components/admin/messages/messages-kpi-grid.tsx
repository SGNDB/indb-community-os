"use client";

import { MessageSquare, MessagesSquare, Users, AlertOctagon, TrendingUp, Zap } from "lucide-react";
import { KpiCard } from "@/components/admin/admin-shared";

export function MessagesKpiGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label="Total Conversations"
        value="12,493"
        trend={{ value: "+12.5%", positive: true }}
        href="#"
        icon={MessageSquare}
      />
      <KpiCard
        label="Messages Today"
        value="45,201"
        trend={{ value: "+5.2%", positive: true }}
        href="#"
        icon={MessagesSquare}
      />
      <KpiCard
        label="Active Conversations"
        value="1,240"
        trend={{ value: "+2.1%", positive: true }}
        href="#"
        icon={Zap}
      />
      <KpiCard
        label="Group Chats"
        value="842"
        trend={{ value: "+8.4%", positive: true }}
        href="#"
        icon={Users}
      />
      <KpiCard
        label="Reported Conversations"
        value="14"
        trend={{ value: "-2.3%", positive: true }}
        href="#"
        icon={AlertOctagon}
      />
      <KpiCard
        label="Daily Growth"
        value="8.2%"
        trend={{ value: "+1.1%", positive: true }}
        href="#"
        icon={TrendingUp}
      />
    </div>
  );
}
