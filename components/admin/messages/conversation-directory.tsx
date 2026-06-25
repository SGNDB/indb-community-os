"use client";

import { useState } from "react";
import { GlassCard, StatusBadge, AdminAvatar } from "@/components/admin/admin-shared";
import { Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockConversations = [
  {
    id: "CONV-9821",
    type: "Idea",
    participants: [{ full_name: "Aisha M.", username: "aisha", avatar_url: null }, { full_name: "Yusuf K.", username: "yusuf", avatar_url: null }],
    status: "active",
    lastActivity: "2 mins ago",
    messagesCount: 42,
    reported: false,
  },
  {
    id: "CONV-9822",
    type: "Graatek",
    participants: [{ full_name: "Fatima S.", username: "fatima", avatar_url: null }, { full_name: "Omar R.", username: "omar", avatar_url: null }],
    status: "completed",
    lastActivity: "1 hour ago",
    messagesCount: 15,
    reported: false,
  },
  {
    id: "CONV-9823",
    type: "Group",
    participants: [{ full_name: "Group Chat", username: "group", avatar_url: null }],
    status: "active",
    lastActivity: "5 mins ago",
    messagesCount: 128,
    reported: true,
  },
];

export function ConversationDirectory() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-6 py-4 font-semibold">ID & Type</th>
                <th className="px-6 py-4 font-semibold">Participants</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Activity</th>
                <th className="px-6 py-4 font-semibold">Messages</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {mockConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{conv.id}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{conv.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {conv.participants.map((p, i) => (
                        <AdminAvatar key={i} profile={p} className="w-8 h-8 ring-2 ring-background" />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={conv.status} />
                    {conv.reported && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <ShieldAlert size={10} /> Reported
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{conv.lastActivity}</td>
                  <td className="px-6 py-4 font-medium">{conv.messagesCount}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedConv(conv.id)}>
                      <Eye size={16} className="mr-2" />
                      View Details
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
            <h3 className="text-xl font-bold mb-4">Conversation Metadata</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">ID</span>
                <span className="font-medium">{selectedConv}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Privacy Status</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">End-to-End Encrypted</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-sm border border-amber-200 dark:border-amber-800/50">
                <p className="font-semibold mb-1">Privacy Notice</p>
                <p>Private message content is hidden by default. Access requires a moderation review and will be audited.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedConv(null)}>Close</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
