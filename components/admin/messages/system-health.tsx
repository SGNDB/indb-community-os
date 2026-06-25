"use client";

import { GlassCard, SectionHeader, StatusBadge } from "@/components/admin/admin-shared";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { MessagesAdminLabels } from "./messages-labels";

export function SystemHealth({labels}: {labels: MessagesAdminLabels}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader eyebrow={labels.systemStatus} title={labels.systemHealth} />
          <StatusBadge status="healthy" label={labels.statusHealthy} />
        </div>
        
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>{labels.realtimeStatus}</span>
            </div>
            <span className="font-semibold">{labels.statusOperational}</span>
          </div>
          
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>{labels.databaseSync}</span>
            </div>
            <span className="font-semibold">{labels.statusOperational}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertTriangle size={18} className="text-amber-500" />
              <span>{labels.pushNotifications}</span>
            </div>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{labels.statusDegraded}</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeader eyebrow={labels.performance} title={labels.metrics} />
        
        <div className="space-y-6 mt-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{labels.averageLatency}</span>
              <span className="font-bold">42ms</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[15%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{labels.deliverySuccessRate}</span>
              <span className="font-bold">99.98%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[99%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{labels.storageUsageImages}</span>
              <span className="font-bold">64%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[64%]" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{labels.storageUsed}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeader eyebrow={labels.queues} title={labels.messageQueues} />
        
        <div className="space-y-4 mt-6">
          <div className="flex items-center p-3 bg-muted/30 rounded-xl border border-border/50">
            <Clock size={32} className="text-primary mr-4 opacity-70" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{labels.databaseWriteQueue}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold">12</span>
                <span className="text-xs text-emerald-500 font-medium mb-1">{labels.statusNormal}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center p-3 bg-muted/30 rounded-xl border border-border/50">
            <Clock size={32} className="text-amber-500 mr-4 opacity-70" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{labels.notificationQueue}</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">1,204</span>
                <span className="text-xs text-amber-500 font-medium mb-1">{labels.statusProcessing}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
