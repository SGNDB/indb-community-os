"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export function LoginForm() {
  const t = useTranslations("Auth.login");
  const [done, setDone] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setDone(true);
      }}
    >
      {done ? <p className="rounded-xl bg-primary/10 p-2 text-xs text-primary">{t("done")}</p> : null}
      <Input type="email" placeholder={t("email")} required />
      <Input type="password" placeholder={t("password")} required />
      <Button type="submit" className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}

