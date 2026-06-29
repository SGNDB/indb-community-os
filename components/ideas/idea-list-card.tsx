"use client";

import {
  CheckCircle2,
  Circle,
  FolderOpen,
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

type IdeaCardData = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  created_at: string;
  author_id: string;
  votes_count?: number | null;
  comments_count?: number | null;
  participants_count?: number | null;
  supporters_count?: number | null;
  author?: {id?: string | null; username?: string | null; full_name?: string | null; avatar_url?: string | null} | null;
  author_name?: string | null;
  author_username?: string | null;
  author_avatar_url?: string | null;
};

function stageKey(status: string | null | undefined) {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "inProgress";
  if (status === "gathering_participants" || status === "approved") return "needsParticipants";
  if (status === "archived") return "archived";
  return "gatheringSupport";
}

function completedStep(step: "published" | "supporters" | "participants" | "progress" | "completed", status: string | null | undefined, supporters: number) {
  if (step === "published") return true;
  if (step === "supporters") return supporters > 0 || ["gathering_participants", "approved", "in_progress", "completed"].includes(status ?? "");
  if (step === "participants") return ["gathering_participants", "approved", "in_progress", "completed"].includes(status ?? "");
  if (step === "progress") return ["in_progress", "completed"].includes(status ?? "");
  return status === "completed";
}

export function IdeaListCard({
  idea,
  currentUserId,
}: {
  idea: IdeaCardData;
  currentUserId?: string | null;
}) {
  const t = useTranslations("Ideas");
  const locale = useLocale();
  const router = useRouter();
  const [supportersCount, setSupportersCount] = useState(idea.supporters_count ?? 0);
  const [supportPending, setSupportPending] = useState(false);
  const [roomPending, setRoomPending] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const authorName = idea.author?.full_name ?? idea.author?.username ?? idea.author_name ?? idea.author_username ?? t("unknownAuthor");
  const authorUsername = idea.author?.username ?? idea.author_username ?? idea.author_id;
  const authorAvatar = idea.author?.avatar_url ?? idea.author_avatar_url ?? null;
  const authorId = idea.author?.id ?? idea.author_id;
  const stage = stageKey(idea.status);

  const timeline = useMemo(
    () => (["published", "supporters", "participants", "progress", "completed"] as const).map((step) => ({
      step,
      done: completedStep(step, idea.status, supportersCount),
    })),
    [idea.status, supportersCount],
  );

  async function handleSupport() {
    if (supportPending) return;
    if (!currentUserId) {
      router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`);
      return;
    }

    const previous = supportersCount;
    setSupportersCount((count) => count + 1);
    setSupportPending(true);

    const formData = new FormData();
    formData.set("ideaId", idea.id);
    const result = await supportIdeaAction(formData);

    setSupportPending(false);
    if (!result.success) {
      setSupportersCount(previous);
      if (result.error === "unauthorized") {
        router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`);
      } else {
        toast.error(t("participationError"));
      }
      return;
    }

    setSupportersCount(result.supportersCount ?? previous);
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
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <Link href={`/profile/${authorUsername}`} className="flex min-w-0 items-center gap-2.5">
          <OnlineAvatar userId={authorId} label={authorName} avatarUrl={authorAvatar} className="h-10 w-10 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{authorName}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {new Date(idea.created_at).toLocaleDateString(locale, {day: "numeric", month: "short", year: "numeric"})}
            </span>
          </span>
        </Link>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {t(`projectStage.${stage}`)}
        </span>
      </header>

      <div className="mt-4">
        <Link href={`/ideas/${idea.id}`} className="text-lg font-bold leading-snug text-foreground transition hover:text-primary">
          {idea.title}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {idea.description}
        </p>
        <Link href={`/ideas/${idea.id}`} className="mt-2 inline-flex text-sm font-semibold text-primary">
          {t("showMore")}
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-muted/35 p-2">
        {[
          {icon: Heart, value: supportersCount, label: t("supporters")},
          {icon: Users, value: idea.participants_count ?? 0, label: t("participants")},
          {icon: MessageCircle, value: idea.comments_count ?? 0, label: t("comments")},
          {icon: ThumbsUp, value: idea.votes_count ?? 0, label: t("votes")},
        ].map(({icon: Icon, value, label}) => (
          <div key={label} className="min-w-0 rounded-xl bg-background/70 px-2 py-2 text-center">
            <Icon size={16} className="mx-auto text-primary" />
            <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
            <p className="truncate text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {timeline.map(({step, done}) => (
          <div key={step} className="flex items-center gap-1.5 text-xs text-muted-foreground sm:flex-col sm:items-start">
            {done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-muted-foreground/40" />}
            <span className={done ? "font-medium text-foreground" : ""}>{t(`projectTimeline.${step}`)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={handleSupport}
          disabled={supportPending}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-70"
        >
          {supportPending ? <Loader2 size={15} className="animate-spin" /> : <ThumbsUp size={15} />}
          {t("support")}
        </button>
        <button
          type="button"
          onClick={() => currentUserId ? setShowJoinModal(true) : router.push(`/login?next=${encodeURIComponent(`/ideas/${idea.id}`)}`)}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border/70 px-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98]"
        >
          <Users size={15} />
          {t("participate")}
        </button>
        <button
          type="button"
          onClick={openProjectRoom}
          disabled={roomPending}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border/70 px-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98] disabled:opacity-70"
        >
          {roomPending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
          {t("discussionButton")}
        </button>
        <Link
          href={`/ideas/${idea.id}`}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border/70 px-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98]"
        >
          <FolderOpen size={15} />
          {t("openProject")}
        </Link>
      </div>

      <ParticipantJoinModal ideaId={idea.id} open={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </article>
  );
}
