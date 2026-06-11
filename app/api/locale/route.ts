import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {routing} from "@/lib/i18n/routing";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const body = (await request.json().catch(() => ({}))) as {locale?: string};
  const locale = body.locale;

  if (locale && routing.locales.includes(locale as (typeof routing.locales)[number])) {
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return NextResponse.json({ok: true});
}


