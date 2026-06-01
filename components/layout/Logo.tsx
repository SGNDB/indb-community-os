"use client";

import Image from "next/image";
import {useTranslations} from "next-intl";

import {cn} from "@/lib/utils/cn";

type LogoVariant = "icon" | "full";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
}

const sizeMap: Record<
  LogoSize,
  {
    iconBox: string;
    title: string;
    subtitle: string;
    gap: string;
  }
> = {
  sm: {
    iconBox: "h-8 w-8",
    title: "text-sm",
    subtitle: "text-[10px]",
    gap: "gap-2",
  },
  md: {
    iconBox: "h-10 w-10",
    title: "text-base",
    subtitle: "text-xs",
    gap: "gap-2.5",
  },
  lg: {
    iconBox: "h-14 w-14",
    title: "text-xl",
    subtitle: "text-sm",
    gap: "gap-3",
  },
};

function LogoIcon({size, priority = false}: {size: LogoSize; priority?: boolean}) {
  const t = useTranslations("Brand");

  return (
    <span
      className={cn(
        "relative inline-flex overflow-hidden rounded-xl border border-border/70 bg-white shadow-[0_6px_16px_rgba(5,40,66,0.10)] dark:bg-white/95",
        sizeMap[size].iconBox,
      )}
      aria-hidden="true"
    >
      <Image
        src="/images/logondb.png"
        alt={t("alt")}
        fill
        priority={priority}
        sizes="(max-width: 768px) 40px, 56px"
        className="object-cover object-center scale-[2.25]"
      />
    </span>
  );
}

export function Logo({
  variant = "full",
  size = "md",
  className,
  priority = false,
}: LogoProps) {
  const t = useTranslations("Brand");

  if (variant === "icon") {
    return (
      <span className={cn("inline-flex", className)}>
        <LogoIcon size={size} priority={priority} />
      </span>
    );
  }

  return (
    <div className={cn("inline-flex items-center", sizeMap[size].gap, className)}>
      <LogoIcon size={size} priority={priority} />
      <span className="leading-tight">
        <span className={cn("block font-semibold tracking-tight text-foreground", sizeMap[size].title)}>
          {t("title")}
        </span>
        <span className={cn("block text-muted-foreground", sizeMap[size].subtitle)}>{t("subtitle")}</span>
      </span>
    </div>
  );
}

