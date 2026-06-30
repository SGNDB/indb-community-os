import {type ReactNode} from "react";
import {cn} from "@/lib/utils/cn";
import {Card, CardContent} from "@/core/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {direction: "up" | "down"; value: string};
  className?: string;
}

export function StatCard({label, value, icon, trend, className}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", trend.direction === "up" ? "text-green-600" : "text-red-600")}>
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && <div className="text-muted-foreground/50">{icon}</div>}
      </CardContent>
    </Card>
  );
}
