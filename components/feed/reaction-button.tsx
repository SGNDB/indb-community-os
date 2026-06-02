"use client";

import {useRef, useState, useEffect} from "react";
import {Heart} from "lucide-react";

import {Button} from "@/components/ui/button";
import {toggleReactionAction} from "@/app/[locale]/server-actions";

const REACTIONS = [
  {type: "like", emoji: "\u{1F44D}", label: "Like"},
  {type: "love", emoji: "\u2764\uFE0F", label: "Love"},
  {type: "laugh", emoji: "\u{1F923}", label: "Laugh"},
  {type: "surprise", emoji: "\u{1F62E}", label: "Surprise"},
  {type: "sad", emoji: "\u{1F622}", label: "Sad"},
  {type: "celebrate", emoji: "\u{1F64F}", label: "Celebrate"},
] as const;

export function ReactionButton({
  postId,
  locale,
  currentReaction,
  likesCount,
}: {
  postId: string;
  locale: string;
  currentReaction?: string | null;
  likesCount: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reactionInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(type: string) {
    setOpen(false);
    if (reactionInputRef.current) {
      reactionInputRef.current.value = type;
    }
    submitRef.current?.click();
  }

  const currentEmoji = REACTIONS.find((r) => r.type === currentReaction)?.emoji;

  return (
    <form action={toggleReactionAction} className="contents">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="postId" value={postId} />
      <input ref={reactionInputRef} type="hidden" name="reactionType" value="" />
      <button ref={submitRef} type="submit" className="hidden" aria-hidden="true" />
      <div ref={ref} className="relative inline-flex">
        <Button
          type="button"
          variant={currentReaction ? "default" : "ghost"}
          onClick={() => setOpen((prev) => !prev)}
          className={`min-h-11 justify-center gap-1.5 rounded-xl px-2 text-xs sm:justify-start sm:gap-2 sm:px-3 sm:text-sm ${
            currentReaction
              ? "bg-primary/10 text-primary hover:bg-primary/15"
              : "text-muted-foreground"
          }`}
        >
          {currentEmoji ? (
            <span className="text-lg">{currentEmoji}</span>
          ) : (
            <Heart size={16} className="shrink-0" />
          )}
          <span>{likesCount}</span>
        </Button>

        {open ? (
          <div className="absolute bottom-full left-0 mb-2 z-50 flex gap-1 rounded-2xl border bg-card p-2 shadow-xl">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                type="button"
                onClick={() => handleSelect(r.type)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition hover:scale-125 ${
                  currentReaction === r.type ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"
                }`}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </form>
  );
}
