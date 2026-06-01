"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export function RegisterForm() {
  const t = useTranslations("Auth.register");
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
      <Input placeholder={t("username")} required />
      <Input type="email" placeholder={t("email")} required />
      <Input type="password" placeholder={t("password")} required />
      <Input type="password" placeholder={t("confirmPassword")} required />
      <Button type="submit" className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}

