"use client";

import { GlassCard, SectionHeader, StatusBadge } from "@/components/admin/admin-shared";
import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";

export function SystemHealth() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader eyebrow="Status" title="System Health" />
          <StatusBadge status="healthy" />
        </div>
        
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>Realtime Status</span>
            </div>
            <span className="font-semibold">Operational</span>
          </div>
          
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>Database Sync</span>
            </div>
            <span className="font-semibold">Operational</span>
          </div>

          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertTriangle size={18} className="text-amber-500" />
              <span>Push Notifications</span>
            </div>
            <span className="font-semibold text-amber-600 dark:text-amber-400">Degraded</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeader eyebrow="Performance" title="Metrics" />
        
        <div className="space-y-6 mt-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Average Latency</span>
              <span className="font-bold">42ms</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[15%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Delivery Success Rate</span>
              <span className="font-bold">99.98%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[99%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Storage Usage (Images)</span>
              <span className="font-bold">64%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[64%]" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">1.2TB of 2.0TB used</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <SectionHeader eyebrow="Queues" title="Message Queues" />
        
        <div className="space-y-4 mt-6">
          <div className="flex items-center p-3 bg-muted/30 rounded-xl border border-border/50">
            <Clock size={32} className="text-primary mr-4 opacity-70" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Database Write Queue</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold">12</span>
                <span className="text-xs text-emerald-500 font-medium mb-1">Normal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center p-3 bg-muted/30 rounded-xl border border-border/50">
            <Clock size={32} className="text-amber-500 mr-4 opacity-70" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Notification Queue</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">1,204</span>
                <span className="text-xs text-amber-500 font-medium mb-1">Processing</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
