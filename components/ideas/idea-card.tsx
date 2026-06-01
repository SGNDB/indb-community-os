"use client";

import {motion} from "framer-motion";
import {Lightbulb} from "lucide-react";

import {IdeaStatusBadge} from "@/components/ideas/idea-status-badge";
import {VoteButton} from "@/components/ideas/vote-button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {IdeaItem} from "@/lib/constants/mock-data";

export function IdeaCard({idea}: {idea: IdeaItem}) {
  return (
    <motion.article
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: "easeOut"}}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Lightbulb size={16} />
              {idea.title}
            </CardTitle>
            <IdeaStatusBadge status={idea.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{idea.description}</p>
          <VoteButton votes={idea.votes} />
        </CardContent>
      </Card>
    </motion.article>
  );
}

