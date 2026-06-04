import type {Metadata, Viewport} from "next";
import {cookies, headers} from "next/headers";
import {hasLocale} from "next-intl";

import {routing} from "@/lib/i18n/routing";
import "./globals.css";

export const metadata: Metadata = {
  title: "I love NDB | INDB Community OS",
  description:
    "Nouadhibou community platform for civic memory, participation, and solutions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const requestedLocale =
    headerStore.get("x-next-intl-locale") ?? cookieStore.get("NEXT_LOCALE")?.value;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === "development" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `document.addEventListener("DOMContentLoaded",()=>{const w=document.documentElement.clientWidth;document.querySelectorAll("*").forEach(el=>{if(el.scrollWidth>w&&el!==document.documentElement&&el!==document.body){console.warn("[OVFL]",el.tagName,el.className,el.scrollWidth+">"+w)}})})`,
            }}
          />
        ) : null}
      </body>
    </html>
  );
}
