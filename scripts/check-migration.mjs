import {createClient} from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, anonKey);

async function check() {
  const {data, error} = await supabase
    .from("community_share_requests")
    .select("id, share_id, requester_id, status")
    .limit(5);
  if (error) console.error("Error:", error.message);
  else console.log("Requests accessible:", data?.length ?? 0);
}

check();
