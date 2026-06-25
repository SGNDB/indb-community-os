"use client";

import {useActionState, useCallback, useEffect, useRef, useState} from "react";
import {CalendarDays, Clock, Heart, MapPin, X} from "lucide-react";
import Link from "next/link";

import {Button, buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils/cn";

const rtlLocales = ["ar", "ff", "snk"];

interface JoinModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: {
    id: string;
    slug: string;
    emoji: string;
    title: string;
    description: string;
    organizer: string;
    location: string;
    date: string;
    duration: string;
    volunteersNeeded: number;
    volunteersJoined: number;
    skills?: string[];
  } | null;
  locale: string;
  isLoggedIn: boolean;
  labels: Record<string, string>;
  onJoin: (opportunityId: string) => Promise<{success: boolean; error?: string}>;
}

export function VolunteerJoinModal({
  open,
  onClose,
  opportunity,
  locale,
  isLoggedIn,
  labels,
  onJoin,
}: JoinModalProps) {
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const isRtl = rtlLocales.includes(locale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
      document.body.style.overflow = "hidden";
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      setMounted(false);
      setDone(false);
      setError("");
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleJoin = useCallback(async () => {
    if (!opportunity || !isLoggedIn) return;
    setJoining(true);
    setError("");
    const result = await onJoin(opportunity.id);
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error || labels.joinError);
    }
    setJoining(false);
  }, [opportunity, isLoggedIn, onJoin, labels.joinError]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }, [onClose]);

  if (!open || !opportunity) return null;

  const progress = opportunity.volunteersNeeded > 0
    ? Math.min(100, Math.round((opportunity.volunteersJoined / opportunity.volunteersNeeded) * 100))
    : 0;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col bg-background transition-all duration-200 outline-none",
        "sm:items-center sm:justify-center sm:bg-black/45 sm:backdrop-blur-sm sm:p-4",
        mounted ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      dir={isRtl ? "rtl" : "ltr"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn(
        "relative z-10 flex flex-col bg-background transition-all duration-300 ease-out",
        "h-dvh w-full",
        "sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-md sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl",
        mounted ? "translate-y-0" : "translate-y-full sm:translate-y-0 sm:scale-95",
      )}>
        {/* Header */}
        <div className="shrink-0 grid grid-cols-3 items-center border-b border-border px-4 min-h-[3.75rem]" style={{paddingTop: "env(safe-area-inset-top, 0px)"}}>
          <div />
          <h1 className="text-center text-sm font-bold text-foreground truncate px-2">
            {done ? labels.joinSuccess : labels.joinTitle}
          </h1>
          <div className="flex items-center justify-end">
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-90 transition" aria-label={labels.close}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 overscroll-contain">
          {done ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <Heart size={40} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-black">{labels.joinSuccessTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {labels.joinSuccessMessage}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full pt-2">
                <Button onClick={onClose} className="h-14 w-full rounded-2xl text-base font-black">
                  {labels.backToOpportunities}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Opportunity summary */}
              <div className="text-center">
                <p className="text-3xl">{opportunity.emoji}</p>
                <h2 className="mt-2 text-lg font-black">{opportunity.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{opportunity.description}</p>
              </div>

              {/* Details */}
              <div className="space-y-3 rounded-2xl bg-muted/40 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{labels.organizer}</span>
                  <span className="text-sm font-bold">{opportunity.organizer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={15} />
                    {labels.location}
                  </span>
                  <span className="text-sm font-bold">{opportunity.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays size={15} />
                    {labels.date}
                  </span>
                  <span className="text-sm font-bold">{opportunity.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock size={15} />
                    {labels.duration}
                  </span>
                  <span className="text-sm font-bold">{opportunity.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{labels.volunteersNeeded}</span>
                  <span className="text-sm font-bold">{opportunity.volunteersNeeded}</span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{labels.progress}</span>
                  <span className="font-bold text-primary">{opportunity.volunteersJoined}/{opportunity.volunteersNeeded}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{width: `${progress}%`}} />
                </div>
              </div>

              {/* Skills */}
              {opportunity.skills && opportunity.skills.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-muted-foreground">{labels.skils}</p>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold">{skill}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Error */}
              {error ? (
                <p className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p>
              ) : null}

              {/* Login hint */}
              {!isLoggedIn ? (
                <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{labels.loginHint}</p>
              ) : null}
            </div>
          )}
        </div>

        {/* Bottom action */}
        {!done ? (
          <div
            className="shrink-0 border-t border-border bg-card px-5 py-4"
            style={{paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))"}}
          >
            {isLoggedIn ? (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="h-14 w-full rounded-2xl text-base font-black"
              >
                {joining ? labels.joining : labels.confirmJoin}
              </Button>
            ) : (
              <Link href={`/${locale}/login?next=/volunteer`} className={cn(buttonVariants(), "h-14 w-full rounded-2xl text-base font-black")}>
                {labels.signIn}
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
