"use client";

type AuthorSummary = {avatar_url?: string | null; full_name?: string | null; username?: string | null} | null;

export function Avatar({author}: {author: AuthorSummary}) {
  if (!author) return null;
  if (author.avatar_url) {
    return <img src={author.avatar_url} alt="" className="size-5 rounded-full object-cover shrink-0" />;
  }
  const initial = (author.full_name ?? author.username ?? "?").charAt(0).toUpperCase();
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#0F4C75] to-[#27C5D8] text-[10px] font-bold text-white shrink-0">
      {initial}
    </span>
  );
}
