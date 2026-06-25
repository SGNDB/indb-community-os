"use client";

import { Activity, ArrowUpRight, ArrowDownRight, Server, Database } from "lucide-react";
import { GlassCard, SectionHeader, LiveDot } from "@/components/admin/admin-shared";

export function RealtimeMonitor() {
  return (
    <GlassCard className="p-6">
      <SectionHeader eyebrow="Live" title="Realtime Monitor">
        <LiveDot />
      </SectionHeader>

      <div className="mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">Messages per minute</p>
              <p className="text-2xl font-bold">142</p>
            </div>
          </div>
          <span className="text-emerald-500 flex items-center text-sm font-medium">
            <ArrowUpRight size={16} /> 12%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Server size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">Active WebSocket Connections</p>
              <p className="text-2xl font-bold">3,492</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">Delivery Failures (Last 1hr)</p>
              <p className="text-2xl font-bold text-rose-500">3</p>
            </div>
          </div>
          <span className="text-rose-500 flex items-center text-sm font-medium">
            <ArrowDownRight size={16} /> 2%
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
