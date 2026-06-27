import type {Metadata} from "next";

import {UserSettingsClient} from "@/components/settings/user-settings-client";
import {getCommunityImpact} from "@/lib/data/community-impact";
import {getProfile} from "@/lib/data/profile";
import {getUserSettings} from "@/lib/data/user-settings";
import {redirect} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const title = locale === "ar" ? "الإعدادات" : locale === "fr" ? "Paramètres" : "Settings";
  const description = locale === "ar"
    ? "إدارة الحساب والخصوصية والإشعارات والمظهر."
    : locale === "fr"
      ? "Gérez le compte, la confidentialité, les notifications et l'apparence."
      : "Manage account, privacy, notifications, and appearance.";

  return {title, description};
}

function getCommunityLevel(score: number, locale: string) {
  if (score >= 1000) return locale === "ar" ? "قائد مجتمعي" : locale === "fr" ? "Leader communautaire" : "Community leader";
  if (score >= 500) return locale === "ar" ? "مساهم مؤثر" : locale === "fr" ? "Contributeur actif" : "Impact contributor";
  if (score >= 100) return locale === "ar" ? "عضو نشط" : locale === "fr" ? "Membre actif" : "Active member";
  return locale === "ar" ? "عضو جديد" : locale === "fr" ? "Nouveau membre" : "New member";
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    redirect({href: "/login", locale});
    return null;
  }

  const [profile, settings, impact] = await Promise.all([
    getProfile(user.id),
    getUserSettings(user.id),
    getCommunityImpact(user.id),
  ]);

  if (!profile) {
    redirect({href: "/login", locale});
    return null;
  }

  const score = profile.contribution_score ?? 0;
  const badges = [
    impact.donations_total > 0 ? "donor" : null,
    impact.volunteer_hours > 0 ? "volunteer" : null,
    impact.graatek_completed > 0 ? "graatek" : null,
    impact.memories_created > 0 ? "memory_keeper" : null,
  ].filter(Boolean) as string[];

  return (
    <UserSettingsClient
      locale={locale}
      profile={profile}
      settings={settings}
      authEmail={user.email ?? null}
      emailVerified={Boolean(user.email_confirmed_at)}
      impact={{
        level: getCommunityLevel(score, locale),
        contribution_score: score,
        volunteer_hours: impact.volunteer_hours,
        graatek_completed: impact.graatek_completed,
        memories_created: impact.memories_created,
        badges,
      }}
    />
  );
}
