import {redirect} from "@/lib/i18n/routing";

export default async function SupportRedirectPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  redirect({href: "/campaigns", locale});
}
