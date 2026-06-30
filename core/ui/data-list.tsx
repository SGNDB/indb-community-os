import {type ReactNode} from "react";
import {cn} from "@/lib/utils/cn";

interface DataListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

export function DataList<T>({data, keyExtractor, renderItem, emptyState, className}: DataListProps<T>) {
  if (data.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <div className={cn("divide-y divide-border", className)}>
      {data.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
