"use server";

import {getAdminUserTimeline} from "@/lib/data/admin";

export async function fetchUserTimeline(userId: string) {
  return getAdminUserTimeline(userId);
}
