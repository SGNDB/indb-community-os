"use client";

import { MessageSquare, MessagesSquare, Users, AlertOctagon, TrendingUp, Zap } from "lucide-react";
import { KpiCard } from "@/components/admin/admin-shared";
import type { MessagesAdminLabels } from "./messages-labels";

export function MessagesKpiGrid({labels}: {labels: MessagesAdminLabels}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label={labels.totalConversations}
        value="0"
        href="#"
        icon={MessageSquare}
      />
      <KpiCard
        label={labels.messagesToday}
        value="0"
        href="#"
        icon={MessagesSquare}
      />
      <KpiCard
        label={labels.activeConversations}
        value="0"
        href="#"
        icon={Zap}
      />
      <KpiCard
        label={labels.groupChats}
        value="0"
        href="#"
        icon={Users}
      />
      <KpiCard
        label={labels.reportedConversations}
        value="0"
        href="#"
        icon={AlertOctagon}
      />
      <KpiCard
        label={labels.dailyGrowth}
        value="0%"
        href="#"
        icon={TrendingUp}
      />
    </div>
  );
}
