import * as React from "react";

import {cn} from "@/lib/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({className, type = "text", ...props}, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export {Input};


