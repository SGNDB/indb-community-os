import {Search, ShieldCheck, Users} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {deleteAdminUserAction} from "@/app/[locale]/server-actions";
import {DeleteUserSubmitButton} from "@/components/admin/delete-user-submit-button";
import {AdminStatusMessage, Avatar, ShellCard, displayName} from "@/components/admin/admin-shared";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {getContributionRankKey} from "@/lib/contribution";
import {getAdminUsers, getCurrentAdminProfile} from "@/lib/data/admin";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{userSearch?: string; status?: string}>;
}) {
  const {locale} = await params;
  const {userSearch = "", status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});
  const [adminProfile, users] = await Promise.all([
    getCurrentAdminProfile(),
    getAdminUsers(userSearch),
  ]);

  return (
    <>
      <AdminStatusMessage status={status} t={t} />
      <section className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_8px_24px_rgba(12,31,44,0.07)]">
          <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users size={22} />
              </span>
              <div>
                <p className="text-sm font-bold text-primary">{t("users.eyebrow")}</p>
                <h1 className="text-2xl font-black">{t("users.title")}</h1>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("users.description")}</p>
              </div>
            </div>
            <form className="flex w-full gap-2 lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="userSearch" defaultValue={userSearch} placeholder={t("users.search")} className="min-h-12 rounded-2xl ps-9" />
              </div>
              <button type="submit" className="min-h-12 rounded-2xl border border-border px-5 text-sm font-black transition hover:bg-muted">
                {t("users.searchButton")}
              </button>
            </form>
          </div>
          <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm font-bold text-muted-foreground sm:px-5">
            {users.length} {t("nav.users")}
          </div>
        </div>

        <div className="space-y-3">
          {users.map((user) => {
            const isSelf = user.id === adminProfile?.id;
            const rank = getContributionRankKey(user.contribution_score ?? 0);
            const visibleRole = isSelf && user.role === "admin" ? t("roles.admin") : t("roles.member");

            return (
              <ShellCard key={user.id} className="p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.5fr)_minmax(180px,0.5fr)_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar profile={user} className="h-12 w-12" />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black">{displayName(user)}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.username ? `@${user.username}` : t("users.noUsername")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2">
                    <ShieldCheck size={17} className="text-primary" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("users.role")}</p>
                      <p className="text-sm font-black">{visibleRole}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-primary/10 px-3 py-2 text-primary">
                    <p className="text-[11px] font-bold uppercase tracking-wide">{t("users.score")}</p>
                    <p className="text-sm font-black">{user.contribution_score ?? 0} · {t(`contributors.rank.${rank}`)}</p>
                  </div>

                  <div className="flex items-center justify-end">
                    {isSelf ? (
                      <Badge className="rounded-full bg-muted px-3 py-2 text-muted-foreground hover:bg-muted">
                        {t("users.selfRoleProtected")}
                      </Badge>
                    ) : (
                      <form action={deleteAdminUserAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="userId" value={user.id} />
                        <DeleteUserSubmitButton
                          confirmLabel={t("users.deleteConfirm")}
                          label={t("users.deleteUser")}
                        />
                      </form>
                    )}
                  </div>
                </div>
              </ShellCard>
            );
          })}
        </div>
      </section>
    </>
  );
}
