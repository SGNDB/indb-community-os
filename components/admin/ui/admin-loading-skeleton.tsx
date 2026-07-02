"use client";

export function AdminLoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 xl:p-8">
      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-64 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
