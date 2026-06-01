"use client";

import {motion} from "framer-motion";
import {ImagePlus, MessageSquareText, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";

const quickActions = [
  {key: "text", icon: MessageSquareText},
  {key: "image", icon: ImagePlus},
  {key: "event", icon: Sparkles},
] as const;

export function CreatePostCard() {
  const t = useTranslations("FeedComposer");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          readOnly
          className="h-12 rounded-2xl border-border/80 bg-muted/40"
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
        />
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.key}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: index * 0.05, duration: 0.2}}
            >
              <Button variant="outline" className="w-full justify-center gap-1.5">
                <action.icon size={15} />
                {t(`quickActions.${action.key}`)}
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

