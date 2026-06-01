import {UserAvatar} from "@/components/layout/user-avatar";

export function CommentCard({
  author,
  content,
  timeAgo,
}: {
  author: string;
  content: string;
  timeAgo: string;
}) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="mb-1 flex items-center gap-2">
        <UserAvatar className="h-7 w-7" label={author} />
        <p className="text-xs font-semibold">{author}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );
}

