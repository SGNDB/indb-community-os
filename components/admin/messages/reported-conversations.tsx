"use client";

import { GlassCard, StatusBadge, AdminAvatar } from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import { Shield, Check, X, AlertTriangle } from "lucide-react";

const mockReports = [
  {
    id: "REP-492",
    reason: "Harassment",
    reporter: { full_name: "Sarah J.", username: "sarahj", avatar_url: null },
    conversationId: "CONV-9823",
    reportDate: "10 mins ago",
    priority: "high",
    status: "pending",
  },
  {
    id: "REP-491",
    reason: "Spam",
    reporter: { full_name: "Ahmed K.", username: "ahmedk", avatar_url: null },
    conversationId: "CONV-9102",
    reportDate: "2 hours ago",
    priority: "low",
    status: "pending",
  },
];

export function ReportedConversations() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="text-rose-500" />
            Moderation Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Review reported conversations to maintain trust and safety.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {mockReports.map((report) => (
          <GlassCard key={report.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${report.priority === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{report.reason}</h3>
                  <StatusBadge status={report.status} />
                  {report.priority === 'high' && (
                    <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full dark:bg-rose-900/30 dark:text-rose-400">
                      High Priority
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Conversation: <span className="font-medium text-foreground">{report.conversationId}</span></span>
                  <span className="flex items-center gap-1">
                    Reported by: <AdminAvatar profile={report.reporter} className="w-5 h-5 ml-1" /> <span className="font-medium text-foreground">{report.reporter.username}</span>
                  </span>
                  <span>{report.reportDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:w-auto w-full">
              <Button className="w-full md:w-auto bg-primary text-primary-foreground">
                Review Context
              </Button>
              <Button variant="outline" size="icon" className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20">
                <Check size={18} />
              </Button>
              <Button variant="outline" size="icon" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20">
                <X size={18} />
              </Button>
            </div>
          </GlassCard>
        ))}

        {mockReports.length === 0 && (
          <div className="p-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">Queue is empty</h3>
            <p className="text-sm text-muted-foreground">All reported conversations have been reviewed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
