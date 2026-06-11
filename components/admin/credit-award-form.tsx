"use client";

import {useMemo, useState} from "react";

import {awardCommunityCreditsAction} from "@/app/[locale]/server-actions";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils/cn";

interface CreditUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  contribution_score: number;
}

interface CreditAwardFormProps {
  awardLabel: string;
  locale: string;
  noMatchesLabel: string;
  noUsersLabel: string;
  notePlaceholder: string;
  pointOptions: readonly number[];
  reasonOptions: {label: string; value: string}[];
  searchPlaceholder: string;
  selectUserLabel: string;
  users: CreditUser[];
}

function userName(user: CreditUser) {
  return user.full_name ?? user.username ?? "-";
}

function initials(name: string) {
  const clean = name.trim();
  if (!clean || clean === "-") return "?";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function CreditAwardForm({
  awardLabel,
  locale,
  noMatchesLabel,
  noUsersLabel,
  notePlaceholder,
  pointOptions,
  reasonOptions,
  searchPlaceholder,
  selectUserLabel,
  users,
}: CreditAwardFormProps) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((user) => {
      const name = userName(user).toLowerCase();
      const username = user.username?.toLowerCase() ?? "";
      return name.includes(normalizedQuery) || username.includes(normalizedQuery);
    });
  }, [query, users]);

  if (users.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-border p-4 text-sm font-semibold text-muted-foreground">
        {noUsersLabel}
      </div>
    );
  }

  return (
    <form action={awardCommunityCreditsAction} className="mt-5 grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="userId" value={selectedUser?.id ?? ""} />

      <div className="space-y-2">
        <label className="text-sm font-bold">{selectUserLabel}</label>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-11 rounded-2xl"
        />
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-card p-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const name = userName(user);
              const isSelected = user.id === selectedUserId;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-2 text-start transition hover:bg-muted",
                    isSelected && "bg-primary/10 text-primary",
                  )}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-black">
                      {initials(name)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {user.username ? `@${user.username}` : `${user.contribution_score ?? 0}`}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="p-3 text-sm font-semibold text-muted-foreground">{noMatchesLabel}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select name="points" defaultValue="25" className="min-h-11 rounded-2xl border border-border bg-card px-4 text-sm font-semibold outline-none ring-primary/25 focus:ring">
          {pointOptions.map((points) => (
            <option key={points} value={points}>+{points}</option>
          ))}
        </select>
        <select name="reason" defaultValue="sharedValuableMemory" className="min-h-11 rounded-2xl border border-border bg-card px-4 text-sm font-semibold outline-none ring-primary/25 focus:ring">
          {reasonOptions.map((reason) => (
            <option key={reason.value} value={reason.value}>{reason.label}</option>
          ))}
        </select>
      </div>
      <Input name="note" placeholder={notePlaceholder} className="min-h-11 rounded-2xl" />
      <Button type="submit" className="min-h-11 rounded-2xl" disabled={!selectedUser}>
        {awardLabel}
      </Button>
    </form>
  );
}
