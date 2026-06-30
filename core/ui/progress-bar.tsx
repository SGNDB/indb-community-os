import {cn} from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({value, max = 100, size = "md", className, label}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      {label && <span className="mb-1 block text-xs text-muted-foreground">{label}</span>}
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", sizeMap[size])}>
        <div
          className={cn("h-full rounded-full bg-primary transition-all duration-500", sizeMap[size])}
          style={{width: `${pct}%`}}
        />
      </div>
    </div>
  );
}
