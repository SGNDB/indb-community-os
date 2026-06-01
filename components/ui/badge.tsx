import * as React from "react";

import {cn} from "@/lib/utils/cn";

function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary",
        className,
      )}
      {...props}
    />
  );
}

export {Badge};


