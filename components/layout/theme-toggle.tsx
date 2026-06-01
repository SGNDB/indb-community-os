"use client";

import {MoonStar, SunMedium} from "lucide-react";
import {useTranslations} from "next-intl";
import {useTheme} from "next-themes";

import {Button} from "@/components/ui/button";

export function ThemeToggle() {
  const {theme, setTheme} = useTheme();
  const t = useTranslations("Theme");
  const isDark = theme === "dark";

  return (
    <Button
      aria-label={t("toggle")}
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
    </Button>
  );
}

