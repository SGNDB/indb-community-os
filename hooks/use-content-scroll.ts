"use client";

import {useEffect, useState} from "react";
import type {RefObject} from "react";

interface UseContentScrollOptions {
  searchParams: URLSearchParams;
  paramName: string;
  domIdPrefix: string;
  contentId: string;
  articleRef: RefObject<HTMLElement | null>;
  commentDomIdPrefix?: string;
  onFocusReactions?: () => void;
  onFocusComments?: () => void;
  delay?: number;
  highlightDuration?: number;
}

export function useContentScroll({
  searchParams,
  paramName,
  domIdPrefix,
  contentId,
  articleRef,
  commentDomIdPrefix,
  onFocusReactions,
  onFocusComments,
  delay = 300,
  highlightDuration = 1500,
}: UseContentScrollOptions) {
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const targetId = searchParams.get(paramName);
    const focus = searchParams.get("focus");
    const commentId = searchParams.get("comment");

    if (targetId !== contentId) return;

    const timer = window.setTimeout(() => {
      if (focus === "reactions") {
        onFocusReactions?.();
        const el = document.getElementById(`${domIdPrefix}-${contentId}-reactions`);
        el?.scrollIntoView({behavior: "smooth", block: "center"});
      } else if (focus === "comments" || commentId) {
        onFocusComments?.();

        window.setTimeout(() => {
          if (commentId) {
            const prefix = commentDomIdPrefix ?? domIdPrefix;
            const el = document.getElementById(`${prefix}-comment-${commentId}`);
            if (el) {
              el.scrollIntoView({behavior: "smooth", block: "center"});
              return;
            }
          }
          const el = document.getElementById(`${domIdPrefix}-${contentId}-comments`);
          el?.scrollIntoView({behavior: "smooth", block: "center"});
        }, 200);
      } else {
        articleRef.current?.scrollIntoView({behavior: "smooth", block: "center"});
      }

      setHighlight(true);
      window.setTimeout(() => setHighlight(false), highlightDuration);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    searchParams,
    paramName,
    domIdPrefix,
    contentId,
    articleRef,
    commentDomIdPrefix,
    onFocusReactions,
    onFocusComments,
    delay,
    highlightDuration,
  ]);

  return {highlight, setHighlight};
}
