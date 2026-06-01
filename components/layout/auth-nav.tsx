"use client";

import {LogOut, UserRound} from "lucide-react";
import {useTranslations} from "next-intl";
import {useFormStatus} from "react-dom";

import {Button} from "@/components/ui/button";
import {Link} from "@/lib/i18n/routing";
import {signOutAction} from "@/app/[locale]/server-actions";

function LogoutButton({label, loading}: {label: string; loading: string}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending} className="gap-1.5">
      <LogOut size={14} />
      {pending ? loading : label}
    </Button>
  );
}

export function AuthNav({locale, isLoggedIn}: {locale: string; isLoggedIn: boolean}) {
  const t = useTranslations("Navbar");

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/profile">
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserRound size={18} />
        </Button>
      </Link>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <LogoutButton label={t("logout")} loading={t("loggingOut")} />
      </form>
    </div>
  );
}
