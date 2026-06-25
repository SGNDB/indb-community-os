"use client";

import { useState } from "react";
import { Download, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessagesKpiGrid } from "./messages-kpi-grid";
import { MessagesAnalyticsCharts } from "./messages-analytics-charts";
import { ConversationDirectory } from "./conversation-directory";
import { ReportedConversations } from "./reported-conversations";
import { RealtimeMonitor } from "./realtime-monitor";
import { SystemHealth } from "./system-health";
import { GroupChatAnalytics } from "./group-chat-analytics";
import { AdminExportDropdown } from "@/components/admin/admin-export-dropdown";

export function MessagesDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "directory" | "moderation" | "system">("overview");

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl bg-card p-4 border border-border/60 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
            className="rounded-full"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === "directory" ? "default" : "outline"}
            onClick={() => setActiveTab("directory")}
            className="rounded-full"
          >
            Directory
          </Button>
          <Button
            variant={activeTab === "moderation" ? "default" : "outline"}
            onClick={() => setActiveTab("moderation")}
            className="rounded-full"
          >
            Moderation
          </Button>
          <Button
            variant={activeTab === "system" ? "default" : "outline"}
            onClick={() => setActiveTab("system")}
            className="rounded-full"
          >
            System Health
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search ID, User..."
              className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-[200px]"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 rounded-full">
            <Filter size={16} />
          </Button>
          <AdminExportDropdown<any>
            title="Messages Export"
            filename="messages-export"
            columns={[{ header: "ID", getValue: (row) => row?.id }]}
            rows={[]}
            labels={{ exportAs: "Export As", csv: "CSV", excel: "Excel", pdf: "PDF" }}
          />
        </div>
      </div>

      {/* Tabs Content */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <MessagesKpiGrid />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MessagesAnalyticsCharts />
            </div>
            <div className="space-y-6">
              <RealtimeMonitor />
              <GroupChatAnalytics />
            </div>
          </div>
        </div>
      )}

      {activeTab === "directory" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ConversationDirectory />
        </div>
      )}

      {activeTab === "moderation" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ReportedConversations />
        </div>
      )}

      {activeTab === "system" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <SystemHealth />
        </div>
      )}
    </div>
  );
}
