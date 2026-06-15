export type ContributionRankKey =
  | "member"
  | "contributor"
  | "communityBuilder"
  | "communityLeader"
  | "ndbChampion";

export function getContributionRankKey(score: number): ContributionRankKey {
  if (score >= 500) return "ndbChampion";
  if (score >= 300) return "communityLeader";
  if (score >= 150) return "communityBuilder";
  if (score >= 50) return "contributor";
  return "member";
}
