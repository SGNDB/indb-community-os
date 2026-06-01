import {MapPin} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export async function UserProfileCard() {
  const t = await getTranslations("ProfileCard");

  return (
    <Card>
      <div className="h-28 rounded-t-2xl bg-gradient-to-r from-primary/95 via-accent/80 to-primary/70" />
      <CardHeader className="-mt-12">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-muted text-xl font-semibold">
          AS
        </div>
        <CardTitle>Ahmed Salem</CardTitle>
        <p className="text-sm text-muted-foreground">{t("bio")}</p>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={13} />
          {t("location")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-lg font-semibold">56</p>
            <p className="text-xs text-muted-foreground">{t("stats.posts")}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-lg font-semibold">18</p>
            <p className="text-xs text-muted-foreground">{t("stats.memories")}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-lg font-semibold">11</p>
            <p className="text-xs text-muted-foreground">{t("stats.ideas")}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Badge>{t("badges.contributor")}</Badge>
          <Badge>{t("badges.historian")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

