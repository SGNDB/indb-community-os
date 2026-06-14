"use client";

import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Logo} from "@/components/shared/logo";

interface OnboardingStep3Props {
  onComplete: () => void;
}

export function OnboardingStep3({onComplete}: OnboardingStep3Props) {
  const t = useTranslations("Onboarding.step3");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8 text-center">
      {/* Logo */}
      <Logo size="lg" priority />

      {/* Welcome message */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#ED2124] sm:text-3xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground sm:text-xl">{t("message")}</p>
      </div>

      {/* Get started button */}
      <Button
        onClick={onComplete}
        className="min-h-14 bg-[#ED2124] px-8 text-lg hover:bg-[#d81e21]"
      >
        {t("getStarted")}
      </Button>
    </div>
  );
}
