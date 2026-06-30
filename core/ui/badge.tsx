import {cn} from "@/lib/utils/cn";

export function PluginBadge({className, variant = "default", ...props}: React.ComponentProps<"span"> & {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variants: Record<string, string> = {
    default: "border-primary/20 bg-primary/10 text-primary",
    success: "border-green-500/20 bg-green-500/10 text-green-600",
    warning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-600",
    danger: "border-red-500/20 bg-red-500/10 text-red-600",
    info: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}

export {Badge} from "@/components/ui/badge";
