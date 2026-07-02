import type {ReactNode} from "react";
import {ChevronRight} from "lucide-react";

import {Link} from "@/lib/i18n/routing";

export interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: {label: string; href: string}[];
  action?: ReactNode;
  children: ReactNode;
}

export function AdminPageLayout({
  title,
  subtitle,
  breadcrumbs,
  action,
  children,
}: AdminPageLayoutProps) {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center gap-2">
              <Link href={item.href} className="transition hover:text-foreground">
                {item.label}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={16} className="text-muted-foreground/50 rtl:rotate-180" />
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div>{children}</div>
    </div>
  );
}
