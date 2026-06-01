import * as React from "react";

import {cn} from "@/lib/utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({className, ...props}, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export {Textarea};


