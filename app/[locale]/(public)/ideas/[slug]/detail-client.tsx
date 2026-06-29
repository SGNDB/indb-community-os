"use client";

/* eslint-disable @next/next/no-img-element */

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Heart,
  Loader2,
  MessageCircle,
  ThumbsUp,
  Users,
} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useMemo, useState} from "react";
import {toast} from "sonner";

import {openIdeaProjectRoomAction, supportIdeaAction} from "@/app/[locale]/server-actions";
import {ParticipantJoinModal} from "@/components/ideas/participant-join-modal";
import {OnlineAvatar} from "@/components/presence";
import {Link, useRouter} from "@/lib/i18n/routing";

function getCategoryName(category: any, locale: string): string {
  if (!category) return "";
  if (locale === "ar") return category.name_ar;
  if (locale === "fr") return category.name_fr;
  if (locale === "ff") return category.name_ff;
  if (locale === "snk") return category.name_snk;
  if (locale === "wo") return category.name_wo;
  return category.name_en;
}

function stageKey(status: string | null | undefined) {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "inProgress";
  if (status === "gathering_participants" || status === "approved") return "needsParticipants";
  if (status === "archived") return "archived";
  return "gatheringSupport";
}

function isStepDone(step: "published" | "supporters" | "participants" | "progress" | "completed", status: string | null | undefined, supporters: number) {
  if (step === "published") return true;
  if (step === "supporters") return supporters > 0 || ["gathering_participants", "approved", "in_progress", "completed"].includes(status ?? "");
  if (step === "participants") return ["gathering_participants", "approved", "in_progress", "completed"].includes(status ?? "");
  if (step === "progress") return ["in_progress", "completed"].includes(status ?? "");
  return status === "completed";
}

function profileName(profile: any, fallback: string) {
  return profile?.full_name ?? profile?.username ?? fallback;
}

export function IdeaDetailClient({
  idea,
  updates,
  milestones,
  progressImages,
  participantPreview,
  supporterPreview,
  participantsCount,
  supportersCount,
  currentUserId,
  userParticipation,
  userSupported: initialUserSupported,
  locale,
}: {
  idea: any;
  updates: any[];
  milestones: any[];
  progressImages: any[];
  participantPreview: any[];
  supporterPreview: any[];
  participantsCount: number;
  supportersCount: number;
  currentUserId: string | null;
  currentUserProfile: {full_name: string | null; username: string | null; avatar_url: string | null} | null;
  userParticipation: {status: string; message: string | null} | null;
  userSupported: boolean;
  locale: string;
}) {
  const t = useTranslations("Ideas");
  const uiLocale = useLocale();
  const router = useRouter();
  const [supportersCountState, setSupportersCount] = useState(supportersCount);
  const [userSupported, setUserSupported] = useState(initialUserSupported);
  const [supportPending, setSupportPending] = useState(false);
  const [roomPending, setRoomPending] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const authorName = idea.author?.full_name ?? idea.author?.username ?? t("unknownAuthor");
  const categoryName = getCategoryName(idea.category, locale);
  const latestUpdate = updates[0] ?? null;
  const mediaItems = [
    ...((idea.media ?? []).map((item: any) => ({url: item.url, type: item.type, caption: null}))),
    ...progressImages.map((item: any) => ({url: item.url, type: "image", caption: item.caption ?? null})),
  ];
  const stage = stageKey(idea.status);
  const canParticipate = !["completed", "archived"].includes(idea.status);
  const userParticipationStatus = userParticipation?.status;

  const progressSteps = useMemo(
    () => (["published", "supporters", "participants", "progress", "completed"] as const).map((step) => ({
      step,
      done: isStepDone(step, idea.status, supportersCountState),
    })),
    [idea.status, supportersCountState],
  );

  const timelineEvents = useMemo(() => {
    const events = [
      {date: idea.created_at, label: t("projectTimeline.published")},
      ...updates.map((update) => ({date: update.created_at, label: update.content})),
      ...milestones.map((milestone) => ({date: milestone.completed_at ?? milestone.created_at ?? idea.created_at, label: milestone.title ?? milestone.description ?? t("milestones")})),
    ];
    if (idea.status === "in_progress") events.push({date: idea.updated_at ?? idea.created_at, label: t("projectTimeline.progress")});
    if (idea.status === "completed") events.push({date: idea.updated_at ?? idea.created_at, label: t("projectTimeline.completed")});
    return events
      .filter((event) => event.date && event.label)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [idea.created_at, idea.status, idea.updated_at, milestones, t, updates]);

  async function handleSupport() {
    if (supportPending) return;
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`);
      return;
    }
    const previousSupported = userSupported;
    const previousCount = supportersCountState;
    setUserSupported((value) => !value);
    setSupportersCount((count) => previousSupported ? Math.max(0, count - 1) : count + 1);
    setSupportPending(true);

    const formData = new FormData();
    formData.set("ideaId", idea.id);
    const result = await supportIdeaAction(formData);
    setSupportPending(false);

    if (!result.success) {
      setUserSupported(previousSupported);
      setSupportersCount(previousCount);
      if (result.error === "unauthorized") {
        router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`);
      } else {
        toast.error(t("participationError"));
      }
      return;
    }

    setUserSupported(result.supported ?? !previousSupported);
    setSupportersCount(result.supportersCount ?? previousCount);
  }

  async function openProjectRoom() {
    if (roomPending) return;
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`);
      return;
    }
    setRoomPending(true);
    const result = await openIdeaProjectRoomAction(idea.id);
    setRoomPending(false);

    if (!result.success || !result.conversationId) {
      toast.error(t(result.error === "forbidden" ? "projectRoomUnavailable" : "participationError"));
      return;
    }

    router.push(`/messages/${result.conversationId}`);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {categoryName ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{categoryName}</span> : null}
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                {t(`projectStage.${stage}`)}
              </span>
            </div>
            <h1 className="text-2xl font-black leading-tight text-foreground sm:text-3xl">{idea.title}</h1>
            <Link href={`/profile/${idea.author?.username ?? idea.author_id}`} className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
              <OnlineAvatar userId={idea.author?.id ?? idea.author_id} label={authorName} avatarUrl={idea.author?.avatar_url} className="h-8 w-8" />
              <span className="font-semibold">{authorName}</span>
              <span>·</span>
              <CalendarDays size={14} />
              <span>{new Date(idea.created_at).toLocaleDateString(uiLocale, {day: "numeric", month: "short", year: "numeric"})}</span>
            </Link>
          </div>
        </div>

        <p className="mt-5 whitespace-pre-line text-base leading-7 text-foreground/85">{idea.description}</p>

        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-muted/35 p-2">
          {[
            {icon: Heart, value: supportersCountState, label: t("supporters")},
            {icon: Users, value: participantsCount, label: t("participants")},
            {icon: MessageCircle, value: idea.comments_count ?? 0, label: t("comments")},
            {icon: ThumbsUp, value: idea.votes_count ?? 0, label: t("votes")},
          ].map(({icon: Icon, value, label}) => (
            <div key={label} className="rounded-xl bg-background/70 px-2 py-3 text-center">
              <Icon size={17} className="mx-auto text-primary" />
              <p className="mt-1 text-lg font-black text-foreground">{value}</p>
              <p className="truncate text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {progressSteps.map(({step, done}) => (
            <div key={step} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2 text-sm text-muted-foreground sm:flex-col sm:items-start">
              {done ? <CheckCircle2 size={17} className="text-emerald-500" /> : <Circle size={17} className="text-muted-foreground/40" />}
              <span className={done ? "font-semibold text-foreground" : ""}>{t(`projectTimeline.${step}`)}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleSupport}
            disabled={supportPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-70"
          >
            {supportPending ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
            {userSupported ? t("support") : t("support")}
          </button>
          {canParticipate && userParticipationStatus !== "accepted" ? (
            <button
              type="button"
              onClick={() => currentUserId ? setShowJoinModal(true) : router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border/70 px-4 text-sm font-bold text-foreground transition hover:bg-muted active:scale-[0.98]"
            >
              <Users size={16} />
              {userParticipationStatus === "pending" ? t("participationPendingShort") : t("participate")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={openProjectRoom}
            disabled={roomPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border/70 px-4 text-sm font-bold text-foreground transition hover:bg-muted active:scale-[0.98] disabled:opacity-70"
          >
            {roomPending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            {t("openProjectRoom")}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-black text-foreground">{t("latestUpdate")}</h2>
        {latestUpdate ? (
          <div className="mt-3 rounded-2xl bg-muted/35 p-4">
            <p className="text-xs font-semibold text-primary">{new Date(latestUpdate.created_at).toLocaleDateString(uiLocale, {weekday: "long", day: "numeric", month: "short"})}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{latestUpdate.content}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("noUpdatesYet")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-black text-foreground">{t("participants")}</h2>
        {participantPreview.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {participantPreview.map((participant) => {
              const user = participant.user;
              return (
                <Link key={participant.id} href={`/profile/${user?.username ?? participant.user_id}`} className="flex items-center gap-2 rounded-full bg-muted/45 py-1 ps-1 pe-3 text-sm font-semibold text-foreground transition hover:bg-muted">
                  <OnlineAvatar userId={participant.user_id} label={profileName(user, t("unknownAuthor"))} avatarUrl={user?.avatar_url} className="h-8 w-8" />
                  <span>{profileName(user, t("unknownAuthor"))}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("noParticipantsYet")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-black text-foreground">{t("supporters")}</h2>
        {supporterPreview.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {supporterPreview.map((supporter) => {
              const user = supporter.profile;
              return (
                <Link key={supporter.user_id} href={`/profile/${user?.username ?? supporter.user_id}`} className="flex items-center gap-2 rounded-full bg-muted/45 py-1 ps-1 pe-3 text-sm font-semibold text-foreground transition hover:bg-muted">
                  <OnlineAvatar userId={supporter.user_id} label={profileName(user, t("unknownAuthor"))} avatarUrl={user?.avatar_url} className="h-8 w-8" />
                  <span>{profileName(user, t("unknownAuthor"))}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("noSupportersYet")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-black text-foreground">{t("projectGallery")}</h2>
        {mediaItems.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mediaItems.slice(0, 12).map((item, index) => (
              <div key={`${item.url}-${index}`} className="overflow-hidden rounded-2xl bg-muted">
                {item.type === "video" ? (
                  <video src={item.url} controls className="aspect-square h-full w-full object-cover" />
                ) : (
                  <img src={item.url} alt={item.caption ?? idea.title} className="aspect-square h-full w-full object-cover" loading="lazy" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("noProjectMedia")}</p>
        )}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-black text-foreground">{t("projectTimelineTitle")}</h2>
        <div className="mt-4 space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={`${event.date}-${index}`} className="grid grid-cols-[5rem_1fr] gap-3">
              <p className="text-xs font-semibold text-muted-foreground">{new Date(event.date).toLocaleDateString(uiLocale, {day: "numeric", month: "short"})}</p>
              <div className="border-s border-border ps-3">
                <p className="text-sm font-semibold leading-6 text-foreground">{event.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ParticipantJoinModal ideaId={idea.id} open={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  );
}
