"use client";

import { MessageSquare, MessagesSquare, Users, AlertOctagon, TrendingUp, Zap } from "lucide-react";
import { KpiCard } from "@/components/admin/admin-shared";
import type { MessagesAdminLabels } from "./messages-labels";

export function MessagesKpiGrid({labels}: {labels: MessagesAdminLabels}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label={labels.totalConversations}
        value="12,493"
        trend={{ value: "+12.5%", positive: true }}
        href="#"
        icon={MessageSquare}
      />
      <KpiCard
        label={labels.messagesToday}
        value="45,201"
        trend={{ value: "+5.2%", positive: true }}
        href="#"
        icon={MessagesSquare}
      />
      <KpiCard
        label={labels.activeConversations}
        value="1,240"
        trend={{ value: "+2.1%", positive: true }}
        href="#"
        icon={Zap}
      />
      <KpiCard
        label={labels.groupChats}
        value="842"
        trend={{ value: "+8.4%", positive: true }}
        href="#"
        icon={Users}
      />
      <KpiCard
        label={labels.reportedConversations}
        value="14"
        trend={{ value: "-2.3%", positive: true }}
        href="#"
        icon={AlertOctagon}
      />
      <KpiCard
        label={labels.dailyGrowth}
        value="8.2%"
        trend={{ value: "+1.1%", positive: true }}
        href="#"
        icon={TrendingUp}
      />
    </div>
  );
}
