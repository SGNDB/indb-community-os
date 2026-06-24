import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
function uid(m) {
  const h = createHash("md5").update("indb-visual-test-v1" + ":" + m).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${(8+(parseInt(h[16],16)&3).toString())}${h.slice(17,20)}-${h.slice(20,32)}`;
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});

// Get a real user ID
const {data: ad} = await s.auth.admin.listUsers();
const user = ad.users.find(u => u.email === '22246000000@phone.indb.local');
console.log('User 000 ID:', user?.id);

// Try a simple insert
const testId = uid('test-insert-1');
console.log('Test post ID:', testId);

const {data, error} = await s.from('posts').insert({
  id: testId,
  author_id: user.id,
  type: 'community',
  title: 'Test post - delete me',
  content: 'This is a test post to verify inserts work',
  language: 'en',
  status: 'published'
}).select();

if (error) {
  console.error('INSERT ERROR:', error.message, error.code, error.details, error.hint);
} else {
  console.log('INSERT OK:', data?.[0]?.id?.slice(0,12));
  // Clean up
  await s.from('posts').delete().eq('id', testId);
  console.log('Cleaned up test post');
}

// Now test upsert
const testId2 = uid('test-upsert-1');
console.log('\nTest upsert ID:', testId2);

const {error: e2} = await s.from('posts').upsert({
  id: testId2,
  author_id: user.id,
  type: 'community',
  title: 'Test upsert - delete me',
  content: 'Testing upsert',
  language: 'en',
  status: 'published'
}, { onConflict: 'id' });

if (e2) {
  console.error('UPSERT ERROR:', e2.message, e2.code, e2.details);
} else {
  console.log('UPSERT OK');
  await s.from('posts').delete().eq('id', testId2);
  console.log('Cleaned up');
}
