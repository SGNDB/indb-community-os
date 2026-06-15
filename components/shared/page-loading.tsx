import {Loader2} from "lucide-react";

export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );
}
