import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});

// Auth: login test
const {error} = await s.auth.signInWithPassword({email:'22246000000@phone.indb.local', password:'TestPass123!'});
console.log('LOGIN:', error ? 'FAIL: '+error.message : 'OK');

// Content counts
const tables = ['posts','memories','ideas','community_shares','comments','post_reactions',
  'idea_votes','idea_supporters','idea_participants','idea_messages','idea_comments',
  'community_share_requests','fadla_request_messages','user_follows','notifications'];
for (const t of tables) {
  const {count} = await s.from(t).select('*', {count:'exact',head:true});
  console.log(`${t}: ${count ?? 0}`);
}

// Verify user 000 sees content
const {data: {user}} = await s.auth.getUser();
if (user) {
  const {data: posts} = await s.from('posts').select('id,content').eq('author_id', user.id).limit(3);
  console.log(`\nUser 000's posts: ${posts?.length || 0}`);
  for (const p of (posts||[]).slice(0,2)) console.log(`  - ${p.content?.slice(0,50)}...`);
}
