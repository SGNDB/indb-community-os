import {createClient} from "@/lib/supabase/server";

export async function getTotalActiveUsers(): Promise<number> {
  const supabase = await createClient();

  const {count} = await supabase
    .from("profiles")
    .select("*", {count: "exact", head: true});

  return count ?? 0;
}
