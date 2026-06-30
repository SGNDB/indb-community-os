import {createClient} from "@/lib/supabase/client";

export function subscribeToChannel(channel: string, event: string, callback: (payload: unknown) => void) {
  const supabase = createClient();
  const subscription = supabase
    .channel(channel)
    .on("postgres_changes" as never, {event: event as never, schema: "public"}, (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export function createRealtimeChannel(name: string) {
  const supabase = createClient();
  return supabase.channel(name);
}

export type SDKRealtimeChannel = ReturnType<typeof createRealtimeChannel>;
