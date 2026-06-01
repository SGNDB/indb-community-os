"use client";

import {useEffect, useMemo, useState} from "react";
import {motion} from "framer-motion";
import {Bookmark, Heart, MessageCircle, Share2} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {CommentCard} from "@/components/feed/comment-card";
import {UserAvatar} from "@/components/layout/user-avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {CommentItem, PostItem} from "@/lib/constants/mock-data";
import {detectContentLanguage, type ContentLanguage} from "@/lib/i18n/detectContentLanguage";
import {translateContent} from "@/lib/i18n/translateContent";

export function PostCard({
  post,
  comments,
}: {
  post: PostItem;
  comments: CommentItem[];
}) {
  const t = useTranslations("Feed");
  const common = useTranslations("Common");
  const locale = useLocale();
  const uiLanguage: ContentLanguage = locale === "ar" || locale === "fr" ? locale : "en";
  const contentLanguage = useMemo(() => detectContentLanguage(post.content), [post.content]);
  const canTranslate = contentLanguage !== uiLanguage;

  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);

  useEffect(() => {
    setIsTranslated(false);
    setTranslatedText(null);
    setIsTranslating(false);
    setTranslationError(false);
  }, [post.content, uiLanguage]);

  async function onToggleTranslation() {
    if (isTranslated) {
      setIsTranslated(false);
      setTranslationError(false);
      return;
    }

    if (translatedText) {
      setIsTranslated(true);
      setTranslationError(false);
      return;
    }

    setIsTranslating(true);
    setTranslationError(false);

    try {
      const result = await translateContent({
        text: post.content,
        sourceLang: contentLanguage,
        targetLang: uiLanguage,
      });

      setTranslatedText(result.translatedText);
      setIsTranslated(true);
    } catch {
      setTranslationError(true);
    } finally {
      setIsTranslating(false);
    }
  }

  const visibleContent = isTranslated && translatedText ? translatedText : post.content;

  return (
    <motion.article
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: "easeOut"}}
    >
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserAvatar label={post.author} />
              <div>
                <CardTitle className="text-base">{post.author}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {post.role} · {post.timeAgo} {t("ago")}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm leading-relaxed">{visibleContent}</p>

            {canTranslate ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={onToggleTranslation}
                  disabled={isTranslating}
                  className="text-xs font-medium text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isTranslated ? common("seeOriginal") : common("seeTranslation")}
                </button>

                {isTranslating ? (
                  <p className="text-xs text-muted-foreground">{common("translating")}</p>
                ) : null}

                {translationError ? (
                  <p className="text-xs text-destructive">{common("translationUnavailable")}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {post.image ? (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <img
                src={post.image}
                alt={post.content}
                className="h-72 w-full object-cover transition duration-300 hover:scale-[1.02]"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Heart size={15} />
              {post.likes}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <MessageCircle size={15} />
              {post.comments}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Bookmark size={15} />
              {t("save")}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Share2 size={15} />
              {t("share")}
            </Button>
          </div>

          {comments.length > 0 ? (
            <div className="space-y-2">
              {comments.slice(0, 2).map((comment) => (
                <CommentCard
                  key={comment.id}
                  author={comment.author}
                  content={comment.content}
                  timeAgo={comment.timeAgo}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.article>
  );
}
