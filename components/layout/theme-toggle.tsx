"use client";

import {MoonStar, SunMedium} from "lucide-react";
import {useTranslations} from "next-intl";
import {useTheme} from "next-themes";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils/cn";

export function ThemeToggle({className}: {className?: string}) {
  const {theme, setTheme} = useTheme();
  const t = useTranslations("Theme");
  const isDark = theme === "dark";

  return (
    <Button
      aria-label={t("toggle")}
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("min-h-11 min-w-11 rounded-full p-0", className)}
    >
      {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
    </Button>
  );
}

