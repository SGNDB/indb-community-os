"use client";

import {useTranslations} from "next-intl";
import {useFormStatus} from "react-dom";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import type {ProfileRow} from "@/types/database";
import {Link} from "@/lib/i18n/routing";
import {updateProfileAction} from "@/app/[locale]/server-actions";

function SubmitButton({label, loading}: {label: string; loading: string}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" className="min-h-11 w-full" disabled={pending}>
      {pending ? loading : label}
    </Button>
  );
}

export function ProfileEditForm({profile, locale}: {profile: ProfileRow; locale: string}) {
  const t = useTranslations("Profile");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateProfileAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <Input name="username" placeholder={t("fields.username")} defaultValue={profile.username ?? ""} required />
          <Input name="fullName" placeholder={t("fields.fullName")} defaultValue={profile.full_name ?? ""} required />
          <Textarea name="bio" placeholder={t("fields.bio")} defaultValue={profile.bio ?? ""} />
          <Input name="city" placeholder={t("fields.city")} defaultValue={profile.city ?? ""} />
          <Input name="languagePreference" placeholder={t("fields.languagePreference")} defaultValue={profile.language_preference} />
          <Input name="avatarUrl" placeholder={t("fields.avatarUrl")} defaultValue={profile.avatar_url ?? ""} />
          <SubmitButton label={t("save")} loading={t("saving")} />
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/profile" className="text-primary hover:underline">{t("cancel")}</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
