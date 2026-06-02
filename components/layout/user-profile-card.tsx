import {MapPin} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {getCurrentProfile, getProfileWithCounts} from "@/lib/data/profile";

export async function UserProfileCard() {
  const profile = await getCurrentProfile();
  const t = await getTranslations("Profile");

  if (!profile) return null;

  const profileWithCounts = await getProfileWithCounts(profile.id);
  if (!profileWithCounts) return null;

  const displayName = profile.full_name ?? profile.username ?? "?";

  return (
    <Card>
      <div className="h-28 rounded-t-2xl bg-gradient-to-r from-primary/95 via-accent/80 to-primary/70" />
      <CardHeader className="-mt-12">
        <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-muted">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-semibold">
              {displayName.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          )}
        </div>
        <CardTitle>{displayName}</CardTitle>
        {profile.bio ? <p className="text-sm text-muted-foreground">{profile.bio}</p> : null}
        {profile.city ? (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={13} />
            {profile.city}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-lg font-semibold">{profileWithCounts.posts_count}</p>
            <p className="text-xs text-muted-foreground">{t("stats.posts")}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-lg font-semibold">{profileWithCounts.memories_count}</p>
            <p className="text-xs text-muted-foreground">{t("stats.memories")}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-lg font-semibold">{profileWithCounts.ideas_count}</p>
            <p className="text-xs text-muted-foreground">{t("stats.ideas")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
