"use client";

import {motion} from "framer-motion";
import {ChevronUp, Loader2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState, useTransition} from "react";
import {toast} from "sonner";

import {Button} from "@/components/ui/button";
import {voteIdeaAction} from "@/app/[locale]/server-actions";

export function VoteButton({ideaId, votes: initialVotes}: {ideaId: string; votes: number}) {
  const t = useTranslations("Ideas");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);

  async function handleVote() {
    if (pending) return;

    const formData = new FormData();
    formData.set("ideaId", ideaId);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await voteIdeaAction(formData);

      if (!result.success) {
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

  return (
    <motion.div whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}>
      <Button
        variant={voted ? "default" : "accent"}
        className="gap-1.5"
        onClick={handleVote}
        disabled={pending}
      >
        {pending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ChevronUp size={16} />
        )}
        {t("vote", {count: votes})}
      </Button>
    </motion.div>
  );
}
