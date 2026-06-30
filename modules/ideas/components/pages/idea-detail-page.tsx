import {ArrowLeft} from "lucide-react";
import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import {Link} from "@/lib/i18n/routing";
import {createClient} from "@/lib/supabase/server";
import {IdeaDetailClient} from "@/modules/ideas/components/pages/detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const supabase = await createClient();
  const {data} = await supabase
    .from("ideas")
    .select("title, description")
    .eq("id", slug)
    .single();

  if (!data) return {title: "Idea not found"};

  return {
    title: data.title,
    description: data.description?.slice(0, 160) ?? "",
  };
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "Ideas"});
  const supabase = await createClient();

  const {
    data: {user: currentUser},
  } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id ?? null;

  const {data: idea} = await supabase
    .from("ideas")
    .select(`
      *,
      author:profiles!ideas_author_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, slug, name_en, name_fr, name_ar, name_ff, name_snk, name_wo)
    `)
    .eq("id", slug)
    .not("author_id", "is", null)
    .single();

  if (!idea) notFound();

  const {data: mediaRows} = await supabase
    .from("idea_media")
    .select("*")
    .eq("idea_id", slug)
    .order("position", {ascending: true});

  (idea as any).media = mediaRows ?? [];

  const {data: updates} = await supabase.rpc("get_idea_updates", {
    p_idea_id: slug,
  });

  const {data: milestones} = await supabase
    .from("idea_milestones")
    .select("*")
    .eq("idea_id", slug)
    .order("sort_order", {ascending: true});

  const {data: progressImages} = await supabase
    .from("idea_progress_images")
    .select("*")
    .eq("idea_id", slug)
    .order("created_at", {ascending: false});

  let userVoted = false;
  if (currentUserId) {
    const {data: vote} = await supabase
      .from("idea_votes")
      .select("id")
      .eq("idea_id", slug)
      .eq("user_id", currentUserId)
      .maybeSingle();
    userVoted = Boolean(vote);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/ideas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} />
        {t("backToIdeas")}
      </Link>

      <IdeaDetailClient
        idea={idea as any}
        updates={updates ?? []}
        milestones={milestones ?? []}
        progressImages={progressImages ?? []}
        currentUserId={currentUserId}
        userVoted={userVoted}
        locale={locale}
      />
    </div>
  );
}
