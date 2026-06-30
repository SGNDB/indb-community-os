import {type ReactNode} from "react";
import {cn} from "@/lib/utils/cn";
import {Inbox} from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({icon, title, description, action, className}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 text-muted-foreground/50">
        {icon ?? <Inbox className="size-16" />}
      </div>
      <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
