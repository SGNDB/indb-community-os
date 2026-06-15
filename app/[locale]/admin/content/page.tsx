import {Trash2} from "lucide-react";
import {getTranslations} from "next-intl/server";

import {deleteAdminContentAction} from "@/app/[locale]/server-actions";
import {AdminStatusMessage, Avatar, ShellCard, contentIcons, displayName} from "@/components/admin/admin-shared";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {getRecentAdminContent} from "@/lib/data/admin";
import {Link} from "@/lib/i18n/routing";

export default async function AdminContentPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
}) {
  const {locale} = await params;
  const {status} = await searchParams;
  const t = await getTranslations({locale, namespace: "Admin"});
  const content = await getRecentAdminContent();

  return (
    <>
      <AdminStatusMessage status={status} t={t} />
      <section className="space-y-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_8px_24px_rgba(12,31,44,0.07)]">
          <p className="text-sm font-bold text-primary">{t("content.eyebrow")}</p>
          <h1 className="text-2xl font-black">{t("content.title")}</h1>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {content.map((item) => {
            const Icon = contentIcons[item.type];
            return (
              <ShellCard key={`${item.type}-${item.id}`} className="flex min-h-60 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge className="rounded-full">{t(`content.type.${item.type}`)}</Badge>
                  <Icon size={18} className="text-muted-foreground" />
                </div>
                <h3 className="mt-4 line-clamp-2 text-lg font-black">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.body ?? "-"}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Avatar profile={item.author} className="h-8 w-8" />
                  <span className="truncate text-xs font-semibold text-muted-foreground">{t("content.by", {name: displayName(item.author)})}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <Link href={item.viewHref} className="inline-flex min-h-11 items-center rounded-2xl border border-border px-4 text-sm font-bold hover:bg-muted">
                    {t("content.view")}
                  </Link>
                  <form action={deleteAdminContentAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="contentId" value={item.id} />
                    <input type="hidden" name="contentType" value={item.type} />
                    <Button type="submit" variant="destructive" size="sm" className="min-h-11 rounded-2xl gap-1">
                      <Trash2 size={15} />
                      {t("content.delete")}
                    </Button>
                  </form>
                </div>
              </ShellCard>
            );
          })}
        </div>
      </section>
    </>
  );
}
