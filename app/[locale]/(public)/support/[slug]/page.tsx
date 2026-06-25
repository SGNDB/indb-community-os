import {redirect} from "@/lib/i18n/routing";

export default async function SupportCampaignRedirectPage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  redirect({href: `/campaigns/${slug}`, locale});
}
