import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});
const tables = ['posts','memories','ideas','community_shares','comments','post_reactions','idea_votes','idea_supporters','idea_participants','idea_messages','idea_comments','community_share_requests','fadla_request_messages','user_follows','notifications'];
for (const t of tables) {
  const {count} = await s.from(t).select('*', {count:'exact',head:true});
  console.log(`${t}: ${count ?? 0}`);
}
