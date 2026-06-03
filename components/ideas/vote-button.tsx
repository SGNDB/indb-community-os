"use client";

import {motion, AnimatePresence} from "framer-motion";
import {Check, ChevronUp, Flame, Loader2, Star} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState, useTransition} from "react";
import {toast} from "sonner";

import {voteIdeaAction} from "@/app/[locale]/server-actions";
import {cn} from "@/lib/utils/cn";

export function VoteButton({ideaId, votes: initialVotes}: {ideaId: string; votes: number}) {
  const t = useTranslations("Ideas");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [pulse, setPulse] = useState(false);

  async function handleVote() {
    if (pending) return;

    const formData = new FormData();
    formData.set("ideaId", ideaId);
    formData.set("locale", locale);

    startTransition(async () => {
      const prevVoted = voted;
      const prevVotes = votes;

      setVoted(!prevVoted);
      setVotes(prevVoted ? prevVotes - 1 : prevVotes + 1);
      setPulse(true);

      const result = await voteIdeaAction(formData);

      if (!result.success) {
        setVoted(prevVoted);
        setVotes(prevVotes);
        if (result.error === "unauthorized") {
          window.location.href = `/${locale}/login?next=/ideas`;
          return;
        }
        toast.error(t("voteFailed") ?? "Vote failed");
        return;
      }

      setVotes(result.votes ?? votes);
      setVoted(result.voted ?? false);
    });
  }

  const isPopular = votes > 20;
  const isFavorite = votes > 50;

  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        onClick={handleVote}
        disabled={pending}
        whileHover={{scale: 1.04}}
        whileTap={{scale: 0.93}}
        onAnimationEnd={() => setPulse(false)}
        className={cn(
          "relative inline-flex items-center gap-1.5 rounded-2xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-shadow select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "min-h-[44px] min-w-[44px]",
          voted
            ? "border-transparent bg-gradient-to-br from-[#0F4C75] to-[#27C5D8] text-white shadow-md"
            : "border-[#0F4C75]/25 bg-white text-[#0F4C75] hover:border-[#0F4C75]/50 hover:shadow-md",
        )}
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : voted ? (
          <Check size={16} className="shrink-0" />
        ) : (
          <ChevronUp size={16} className="shrink-0" />
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={voted ? "voted" : "not-voted"}
            initial={{opacity: 0, y: -6}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 6}}
            transition={{duration: 0.15}}
          >
            {voted ? t("voteLabelVoted") : t("voteLabel")}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span
            key={`count-${votes}`}
            initial={pulse ? {scale: 1.3} : false}
            animate={{scale: 1}}
            transition={{type: "spring", stiffness: 400, damping: 15}}
          >
            {votes}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {isFavorite ? (
        <motion.span
          initial={{opacity: 0, scale: 0.8}}
          animate={{opacity: 1, scale: 1}}
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
        >
          <Star size={12} className="fill-amber-500 text-amber-500" />
          {t("communityFavorite")}
        </motion.span>
      ) : isPopular ? (
        <motion.span
          initial={{opacity: 0, scale: 0.8}}
          animate={{opacity: 1, scale: 1}}
          className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
        >
          <Flame size={12} className="text-orange-500" />
          {t("popularIdea")}
        </motion.span>
      ) : null}
    </div>
  );
}
