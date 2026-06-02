"use client";

import Image from "next/image";
import {useState} from "react";
import {useTranslations} from "next-intl";
import {useFormStatus} from "react-dom";
import {Camera, Upload, X} from "lucide-react";

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile.cover_image_url);

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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{t("fields.avatarUrl")}</label>
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="" fill className="object-cover" />
                ) : (
                  <Camera size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  name="avatarFile"
                  accept="image/*"
                  className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAvatarPreview(URL.createObjectURL(file));
                  }}
                />
                <input type="hidden" name="avatarUrl" value={profile.avatar_url ?? ""} />
              </div>
              {avatarPreview && avatarPreview !== profile.avatar_url ? (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(profile.avatar_url);
                    const input = document.querySelector<HTMLInputElement>('input[name="avatarFile"]');
                    if (input) input.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{t("fields.coverImage")}</label>
            {coverPreview ? (
              <div className="relative h-32 w-full overflow-hidden rounded-xl bg-muted">
                <Image src={coverPreview} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverPreview(null)}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-muted-foreground shrink-0" />
              <input
                type="file"
                name="coverFile"
                accept="image/*"
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setCoverPreview(URL.createObjectURL(file));
                }}
              />
              <input type="hidden" name="coverImageUrl" value={profile.cover_image_url ?? ""} />
            </div>
          </div>

          <SubmitButton label={t("save")} loading={t("saving")} />
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/profile" className="text-primary hover:underline">{t("cancel")}</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
