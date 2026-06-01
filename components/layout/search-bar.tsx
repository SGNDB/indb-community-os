"use client";

import {Search} from "lucide-react";
import {useTranslations} from "next-intl";

import {Input} from "@/components/ui/input";

export function SearchBar() {
  const t = useTranslations("Search");

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="pointer-events-none absolute inset-y-0 start-3 my-auto text-muted-foreground"
      />
      <Input
        placeholder={t("placeholder")}
        className="h-10 rounded-full border-border/70 bg-card ps-9"
        aria-label={t("placeholder")}
      />
    </div>
  );
}

