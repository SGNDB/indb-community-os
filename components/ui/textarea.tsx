import * as React from "react";

import {cn} from "@/lib/utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({className, ...props}, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-20 max-h-48 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm max-sm:text-base outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring overflow-y-auto resize-y",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export {Textarea};


