"use client";

import { GlassCard, SectionHeader } from "@/components/admin/admin-shared";
import { Users, Lightbulb, Gift, Clock, MessageCircle } from "lucide-react";

export function GroupChatAnalytics() {
  return (
    <GlassCard className="p-6">
      <SectionHeader eyebrow="Groups" title="Group Chat Analytics" />
      
      <div className="mt-6 grid gap-4 grid-cols-2">
        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Lightbulb size={16} />
            <span className="text-xs font-semibold uppercase">Idea Groups</span>
          </div>
          <span className="text-2xl font-bold">482</span>
        </div>
        
        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Gift size={16} />
            <span className="text-xs font-semibold uppercase">Graatek</span>
          </div>
          <span className="text-2xl font-bold">360</span>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border/50 col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Participants</p>
              <p className="font-semibold">8.4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <MessageCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Messages</p>
              <p className="font-semibold">142</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Response</p>
              <p className="font-semibold">&lt; 2m</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
