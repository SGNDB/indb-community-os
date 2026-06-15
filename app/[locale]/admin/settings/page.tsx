import {getTranslations} from "next-intl/server";

import {ShellCard} from "@/components/admin/admin-shared";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Admin"});

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <ShellCard className="p-5 sm:p-6">
        <p className="text-sm font-bold text-primary">{t("identity.eyebrow")}</p>
        <h1 className="mt-2 text-2xl font-black">{t("identity.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("identity.description")}</p>
        <div className="mt-8 rounded-2xl bg-muted p-4">
          <p className="text-sm font-semibold text-muted-foreground">{t("identity.settingsNote")}</p>
        </div>
      </ShellCard>

      <ShellCard className="p-5 sm:p-6">
        <p className="text-sm font-bold text-primary">{t("nav.settings")}</p>
        <h2 className="mt-2 text-xl font-black">INDB</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {locale === "ar"
            ? "إعدادات متقدمة ستضاف لاحقًا بدون تعطيل تجربة المجتمع."
            : locale === "fr"
              ? "Les paramètres avancés seront ajoutés plus tard sans perturber l’expérience communautaire."
              : "Advanced settings will be added later without disrupting the community experience."}
        </p>
      </ShellCard>
    </section>
  );
}
