"use client";

import { useState } from "react";
import { GlassCard, StatusBadge, AdminAvatar } from "@/components/admin/admin-shared";
import { Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MessagesAdminLabels } from "./messages-labels";

const mockConversations = [
  {
    id: "CONV-9821",
    typeKey: "typeIdea",
    participants: [{ full_name: "Aisha M.", username: "aisha", avatar_url: null }, { full_name: "Yusuf K.", username: "yusuf", avatar_url: null }],
    statusKey: "statusActive",
    status: "active",
    lastActivityKey: "minutesAgo",
    messagesCount: 42,
    reported: false,
  },
  {
    id: "CONV-9822",
    typeKey: "typeGraatek",
    participants: [{ full_name: "Fatima S.", username: "fatima", avatar_url: null }, { full_name: "Omar R.", username: "omar", avatar_url: null }],
    statusKey: "statusCompleted",
    status: "completed",
    lastActivityKey: "hourAgo",
    messagesCount: 15,
    reported: false,
  },
  {
    id: "CONV-9823",
    typeKey: "typeGroup",
    participants: [{ full_name: "Group Chat", username: "group", avatar_url: null }],
    statusKey: "statusActive",
    status: "active",
    lastActivityKey: "minutesAgo",
    messagesCount: 128,
    reported: true,
  },
];

export function ConversationDirectory({labels}: {labels: MessagesAdminLabels}) {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-6 py-4 font-semibold">{labels.idAndType}</th>
                <th className="px-6 py-4 font-semibold">{labels.participants}</th>
                <th className="px-6 py-4 font-semibold">{labels.status}</th>
                <th className="px-6 py-4 font-semibold">{labels.activity}</th>
                <th className="px-6 py-4 font-semibold">{labels.messages}</th>
                <th className="px-6 py-4 font-semibold text-right">{labels.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {mockConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{conv.id}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{labels[conv.typeKey]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {conv.participants.map((p, i) => (
                        <AdminAvatar key={i} profile={p} className="w-8 h-8 ring-2 ring-background" />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={conv.status} label={labels[conv.statusKey]} />
                    {conv.reported && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <ShieldAlert size={10} /> {labels.reported}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{labels[conv.lastActivityKey]}</td>
                  <td className="px-6 py-4 font-medium">{conv.messagesCount}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedConv(conv.id)}>
                      <Eye size={16} className="mr-2" />
                      {labels.viewDetails}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Slide-over or Modal for Details could go here. For now, basic conditional render */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">{labels.conversationMetadata}</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">ID</span>
                <span className="font-medium">{selectedConv}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{labels.privacyStatus}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{labels.endToEndEncrypted}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-sm border border-amber-200 dark:border-amber-800/50">
                <p className="font-semibold mb-1">{labels.privacyNoticeTitle}</p>
                <p>{labels.privacyNoticeDescription}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedConv(null)}>{labels.close}</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
