"use client";

import {motion} from "framer-motion";
import {ChevronUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";

export function VoteButton({votes}: {votes: number}) {
  const t = useTranslations("Ideas");

  return (
    <motion.div whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}>
      <Button variant="accent" className="gap-1.5">
        <ChevronUp size={16} />
        {t("vote", {count: votes})}
      </Button>
    </motion.div>
  );
}

