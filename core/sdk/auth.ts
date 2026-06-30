import {createClient} from "@/lib/supabase/client";
import {createClient as createServerClient} from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {data: {user}} = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createServerClient();
  const {data: {session}} = await supabase.auth.getSession();
  return session;
}

export function useAuth() {
  const supabase = createClient();
  return supabase.auth;
}

export function getClientAuth() {
  return createClient().auth;
}

export type SDKUser = Awaited<ReturnType<typeof getCurrentUser>>;
export type SDKSession = Awaited<ReturnType<typeof getSession>>;
