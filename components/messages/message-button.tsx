"use client";

import {useTransition} from "react";
import {MessageCircle} from "lucide-react";
import {useTranslations} from "next-intl";
import {toast} from "sonner";

import {createOrGetDirectConversationAction} from "@/app/[locale]/server-actions";
import {Button} from "@/components/ui/button";
import {useRouter} from "@/lib/i18n/routing";

export function MessageButton({targetUserId}: {targetUserId: string}) {
  const t = useTranslations("Profile");
  const toasts = useTranslations("Toasts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createOrGetDirectConversationAction(targetUserId);
      if (!result.success) {
        if (result.error === "forbidden" || result.error === "direct_mutual_required") {
          toast.error(t("cannotMessage"));
        } else {
          toast.error(toasts("error"));
        }
        return;
      }
      router.push(`/messages?conversation=${result.conversationId}`);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full px-4"
    >
      <MessageCircle size={16} className="me-1.5" />
      {t("message")}
    </Button>
  );
}
