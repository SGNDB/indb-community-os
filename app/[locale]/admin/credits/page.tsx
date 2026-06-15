import {getTranslations} from "next-intl/server";

import {CreditAwardForm} from "@/components/admin/credit-award-form";
import {AdminStatusMessage, Avatar, ShellCard, displayName} from "@/components/admin/admin-shared";
import {Badge} from "@/components/ui/badge";
import {
  adminCreditPointOptions,
  adminCreditReasons,
  getAdminUsers,
  getRecentAdminCredits,
} from "@/lib/data/admin";

export default async function AdminCreditsPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
}) {
  const {locale} = await params;
  const {status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});
  const [users, credits] = await Promise.all([
    getAdminUsers(),
    getRecentAdminCredits(),
  ]);
  const emptyLabels = {
    noUsers: locale === "ar" ? "لا يوجد مستخدمون متاحون" : locale === "fr" ? "Aucun utilisateur disponible" : "No users available",
    noMatches: locale === "ar" ? "لا يوجد مستخدم مطابق" : locale === "fr" ? "Aucun utilisateur trouvé" : "No matching users",
  };

  return (
    <>
      <AdminStatusMessage status={status} t={t} />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <ShellCard className="p-5 sm:p-6">
          <p className="text-sm font-bold text-primary">{t("credits.eyebrow")}</p>
          <h1 className="text-2xl font-black">{t("credits.title")}</h1>
          <CreditAwardForm
            awardLabel={t("credits.award")}
            locale={locale}
            noMatchesLabel={emptyLabels.noMatches}
            noUsersLabel={emptyLabels.noUsers}
            notePlaceholder={t("credits.notePlaceholder")}
            pointOptions={adminCreditPointOptions}
            reasonOptions={adminCreditReasons.map((reason) => ({
              label: t(`creditReasons.${reason}`),
              value: reason,
            }))}
            searchPlaceholder={t("users.search")}
            selectUserLabel={t("credits.user")}
            users={users}
          />
        </ShellCard>

        <ShellCard className="p-5 sm:p-6">
          <h2 className="text-xl font-black">{t("credits.recent")}</h2>
          <div className="mt-4 space-y-3">
            {credits.length > 0 ? credits.map((credit) => (
              <div key={credit.id} className="flex items-center gap-3 rounded-2xl bg-muted/30 p-3">
                <Avatar profile={credit.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{displayName(credit.user)}</p>
                  <p className="truncate text-sm text-muted-foreground">{credit.reason}</p>
                </div>
                <Badge className="rounded-full px-3 py-1">+{credit.points}</Badge>
              </div>
            )) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">{t("credits.empty")}</p>
            )}
          </div>
        </ShellCard>
      </section>
    </>
  );
}
