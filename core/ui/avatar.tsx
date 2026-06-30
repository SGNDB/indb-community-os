import {cn} from "@/lib/utils/cn";

interface PluginAvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallback?: string;
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

export function PluginAvatar({src, alt = "", size = "md", className, fallback}: PluginAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
        sizeMap[size],
        className,
      )}
      aria-label={alt}
    >
      {fallback ?? alt?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}
