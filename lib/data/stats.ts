import {createClient} from "@/lib/supabase/server";
import {unstable_cache} from "next/cache";

export const getTotalActiveUsers = unstable_cache(
  async (): Promise<number> => {
    const supabase = await createClient();
    const {count} = await supabase
      .from("profiles")
      .select("*", {count: "exact", head: true});
    return count ?? 0;
  },
  ["total-active-users"],
  {revalidate: 60, tags: ["stats"]},
);
