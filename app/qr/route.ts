import {cookies} from "next/headers";

import {routing} from "@/lib/i18n/routing";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.set("qr_ref", "1", {
    path: "/",
    maxAge: 86400,
    httpOnly: false,
    sameSite: "lax",
  });

  const url = new URL(`/${routing.defaultLocale}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  return Response.redirect(url, 307);
}
