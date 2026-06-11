import {createClient} from "@/lib/supabase/server";
import type {ProfileEducationRow, ProfileHobbyRow, ProfileInterestRow, ProfileLinkRow, ProfileTravelRow, ProfileWorkRow} from "@/types/database";

export async function getProfileWork(profileId: string): Promise<ProfileWorkRow[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("profile_work")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order")
    .order("start_year", {ascending: false});
  return data ?? [];
}

export async function getProfileEducation(profileId: string): Promise<ProfileEducationRow[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("profile_education")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order")
    .order("start_year", {ascending: false});
  return data ?? [];
}

export async function getProfileInterests(profileId: string): Promise<ProfileInterestRow[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("profile_interests")
    .select("*")
    .eq("profile_id", profileId)
    .order("name");
  return data ?? [];
}

export async function getProfileHobbies(profileId: string): Promise<ProfileHobbyRow[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("profile_hobbies")
    .select("*")
    .eq("profile_id", profileId)
    .order("name");
  return data ?? [];
}

export async function getProfileLinks(profileId: string): Promise<ProfileLinkRow[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("profile_links")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order");
  return data ?? [];
}

export async function getProfileTravel(profileId: string): Promise<ProfileTravelRow[]> {
  const supabase = await createClient();
  const {data} = await supabase
    .from("profile_travel")
    .select("*")
    .eq("profile_id", profileId)
    .order("country");
  return data ?? [];
}

export async function getFullProfileDetails(profileId: string) {
  const [work, education, interests, hobbies, links, travel] = await Promise.all([
    getProfileWork(profileId),
    getProfileEducation(profileId),
    getProfileInterests(profileId),
    getProfileHobbies(profileId),
    getProfileLinks(profileId),
    getProfileTravel(profileId),
  ]);

  return {work, education, interests, hobbies, links, travel};
}
