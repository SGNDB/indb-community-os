"use client";

import {Search, X} from "lucide-react";
import {useTranslations} from "next-intl";
import {useState} from "react";

export interface SearchFilters {
  query: string;
  status: string | null;
  sort: string;
  categoryId?: string | null;
}

export function IdeaSearchBar({
  categories,
  onSearch,
  initialFilters,
}: {
  categories: {id: number; name: string}[];
  onSearch: (filters: SearchFilters) => void;
  initialFilters: SearchFilters;
}) {
  const t = useTranslations("Ideas");
  const [query, setQuery] = useState(initialFilters.query);
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId ?? "");

  function apply(nextQuery = query, nextCategory = categoryId) {
    onSearch({
      query: nextQuery,
      categoryId: nextCategory || null,
      status: initialFilters.status,
      sort: initialFilters.sort || "newest",
    });
  }

  function clearSearch() {
    setQuery("");
    apply("", categoryId);
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-border/60 bg-card p-2 sm:grid-cols-[1fr_15rem]">
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") apply();
          }}
          placeholder={t("searchPlaceholder")}
          className="h-12 w-full rounded-xl border border-transparent bg-muted/45 pe-10 ps-10 text-sm outline-none ring-primary/30 transition focus:bg-background focus:ring"
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      <select
        value={categoryId}
        onChange={(event) => {
          setCategoryId(event.target.value);
          apply(query, event.target.value);
        }}
        className="h-12 rounded-xl border border-transparent bg-muted/45 px-3 text-sm font-medium text-foreground outline-none ring-primary/30 transition focus:bg-background focus:ring"
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((category) => (
          <option key={category.id} value={String(category.id)}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
