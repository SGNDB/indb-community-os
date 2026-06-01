import {getTranslations} from "next-intl/server";

import {ProfileEditForm} from "@/components/profile/profile-edit-form";
import {getCurrentProfile} from "@/lib/data/profile";
import {redirect} from "@/lib/i18n/routing";

export default async function ProfileEditPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; updated?: string}>;
}) {
  const {locale} = await params;
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect({href: "/login", locale});
    return;
  }

  const t = await getTranslations({locale, namespace: "Profile"});
  const {error, updated} = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {updated ? <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{t("updated")}</p> : null}
      {error ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <ProfileEditForm profile={profile} locale={locale} />
    </div>
  );
}
